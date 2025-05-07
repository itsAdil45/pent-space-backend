/** @format */

const { create } = require("domain");
const { prisma } = require("../../configs/prisma");

const {
  serverErrorResponse,
  okResponse,
  notFound,
  badRequestResponse,
} = require("../../constants/responses");

const sendServiceSearchNotification = require("@/notifications/service_search");


const createService = async (req, res) => {
  const { user } = req.user;
  const { service_image } = req;

  const { service_category_id, longitude, latitude } = req.body;
  try {
    if (user.user_type !== "BUSINESS") {
      const response = badRequestResponse("Only business can create services");
      return res.status(response.status.code).json(response);
    }
    const result = await prisma.services.create({
      data: {
        ...req.body,
        business_id: user.id,
        service_category_id: Number(service_category_id),
        service_images: {
          createMany: {
            data: service_image.map((url) => ({
              image: url,
            })),
          },
        },
      },
    });

    const response = okResponse(result, "Successfully Created");
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const getAllServices = async (req, res) => {
  let {
    longitude,
    latitude,
    radius,
    first_key_word,
    second_key_word,
    third_key_word,
    city,
    state,
    street,
    country
  } = req.query;
  const { user } = req.user;
  
  // Collect search keywords
  const keywords = [];
  if (first_key_word) keywords.push(first_key_word);
  if (second_key_word) keywords.push(second_key_word);
  if (third_key_word) keywords.push(third_key_word);
  
  radius = radius || 10;
  
  try {
    // Check if we have any search parameters
    if (!longitude && !latitude && !city && !state && !street && !country && keywords.length === 0) {
      const response = badRequestResponse("At least one search parameter is required");
      return res.status(response.status.code).json(response);
    }
    
    let locationSearch = false;
    let searchCity = '';
    let searchStreet = '';
    let searchState = '';
    let searchCountry = '';
    
    // Parse location components from longitude string format
    if (longitude && typeof longitude === 'string' && longitude.includes('/')) {
      locationSearch = true;
      const parts = longitude.split('/').map(part => part.trim());
      
      if (parts.length >= 1) searchStreet = parts[0];
      if (parts.length >= 2) searchCity = parts[1];
      if (parts.length >= 3) searchState = parts[2]; 
      if (parts.length >= 4) searchCountry = parts[3];
    }
    
    // Override with explicitly provided parameters
    if (street) searchStreet = street;
    if (city) searchCity = city;
    if (state) searchState = state;
    if (country) searchCountry = country;
    
    // If any location component is provided, mark as location search
    if (searchStreet || searchCity || searchState || searchCountry) {
      locationSearch = true;
    }

    // Use coordinate search only if latitude/longitude are provided as numbers and no location string search
    const useCoordinateSearch = (latitude && longitude && !locationSearch);
    
    let baseQuery;
    let queryParams = [];
    
    if (useCoordinateSearch) {
      // Convert to numbers for coordinate search
      longitude = parseFloat(longitude);
      latitude = parseFloat(latitude);
      radius = parseFloat(radius);
      
      baseQuery = `
        SELECT 
          s.id,
          s.longitude,
          s.latitude,
          s.service_name,
          s.description,
          s.country,
          bu.business_name,
          bu.email,
          bu.address,
          bu.id as business_id,
          bu.profile_picture as business_image,
          bu.phone, 
          bu.first_key_word,
          bu.second_key_word,
          bu.third_key_word,
          (SELECT si.image FROM service_images as si WHERE si.service_id = s.id LIMIT 1) as service_image, 
          CAST((6371 * acos(
            cos(radians(${latitude})) * cos(radians(s.latitude)) *
            cos(radians(s.longitude) - radians(${longitude})) +
            sin(radians(${latitude})) * sin(radians(s.latitude))
          )) AS FLOAT) AS distance 
        FROM services as s 
        JOIN service_categories as sc ON sc.id = s.service_category_id 
        JOIN users as bu ON bu.id = s.business_id 
        WHERE (6371 * acos(
          cos(radians(${latitude})) * cos(radians(s.latitude)) *
          cos(radians(s.longitude) - radians(${longitude})) +
          sin(radians(${latitude})) * sin(radians(s.latitude))
        )) <= ${radius} 
        AND s.is_active = ${true} 
        AND sc.is_active = ${true} 
      `;
    } else {
      // Text-based search with match indicators
      baseQuery = `
        SELECT 
          s.id,
          s.longitude,
          s.latitude,
          s.service_name,
          s.description,
          s.country,
          bu.business_name,
          bu.email,
          bu.address,
          bu.id as business_id,
          bu.profile_picture as business_image,
          bu.phone, 
          bu.first_key_word,
          bu.second_key_word,
          bu.third_key_word,
          (SELECT si.image FROM service_images as si WHERE si.service_id = s.id LIMIT 1) as service_image,
          CASE 
            WHEN s.longitude LIKE ? THEN 'exact_street_match'
            ELSE 'no_street_match'
          END as street_match,
          CASE 
            WHEN s.longitude LIKE ? THEN 'exact_city_match'
            ELSE 'no_city_match'
          END as city_match,
          CASE 
            WHEN s.longitude LIKE ? THEN 'exact_state_match'
            ELSE 'no_state_match'
          END as state_match,
          CASE 
            WHEN s.longitude LIKE ? THEN 'exact_country_match'
            ELSE 'no_country_match'
          END as country_match
        FROM services as s 
        JOIN service_categories as sc ON sc.id = s.service_category_id 
        JOIN users as bu ON bu.id = s.business_id 
        WHERE s.is_active = ? 
        AND sc.is_active = ? 
      `;
      
      // Add parameters for the CASE statements
      const streetPattern = searchStreet ? `%/${searchStreet}/%` : `%%`; 
      const cityPattern = searchCity ? `%/${searchCity}/%` : `%%`;
      const statePattern = searchState ? `%/${searchState}/%` : `%%`;
      const countryPattern = searchCountry ? `%/${searchCountry}` : `%%`;
      
      queryParams.push(streetPattern, cityPattern, statePattern, countryPattern, true, true);
      
      // Build the WHERE clause for location filtering
      const locationConditions = [];
      
      if (searchStreet) {
        locationConditions.push(`s.longitude LIKE ?`);
        queryParams.push(`%${searchStreet}%`);
      }
      
      if (searchCity) {
        locationConditions.push(`s.longitude LIKE ?`);
        queryParams.push(`%${searchCity}%`);
      }
      
      if (searchState) {
        locationConditions.push(`s.longitude LIKE ?`);
        queryParams.push(`%${searchState}%`);
      }
      
      if (searchCountry) {
        locationConditions.push(`s.longitude LIKE ?`);
        queryParams.push(`%${searchCountry}%`);
      }
      
      if (locationConditions.length > 0) {
        baseQuery += ` AND (${locationConditions.join(' OR ')})`;
      }
    }

    // Build where clause for keyword matching against user profile keywords
    let keywordClause = '';
    const keywordParams = [];
    
    if (keywords.length > 0) {
      const keywordConditions = [];
      
      for (const keyword of keywords) {
        keywordConditions.push(
          `bu.first_key_word LIKE ?`,
          `bu.second_key_word LIKE ?`,
          `bu.third_key_word LIKE ?`
        );
        keywordParams.push(
          `%${keyword}%`, 
          `%${keyword}%`, 
          `%${keyword}%`
        );
      }
      
      keywordClause = ` AND (${keywordConditions.join(' OR ')})`;
    }

    // Complete query
    const fullQuery = baseQuery + keywordClause;
    
    // Execute the query with parameterized values for safety
    const get_all_services = await prisma.$queryRawUnsafe(
      fullQuery, 
      ...queryParams,
      ...keywordParams
    );
    
    console.log(`Found ${get_all_services.length} services${keywords.length ? ' matching keywords' : ''}`);

    // Process notifications for service views as before...
    if (get_all_services && get_all_services.length > 0) {
      try {
        // Extract unique business IDs
        const businessIds = Array.from(new Set(
          get_all_services.map(service => service.business_id)
        ));
        
        // Don't send notification to the user themselves if they're a business
        const filteredBusinessIds = user.user_type === "BUSINESS" 
          ? businessIds.filter(id => id !== user.id) 
          : businessIds;
          
        console.log(`Found ${filteredBusinessIds.length} businesses to notify about view`);
        
        if (filteredBusinessIds.length > 0) {
          // Get business FCM tokens
          const businesses = await prisma.users.findMany({
            where: {
              id: {
                in: filteredBusinessIds
              },
              fcm_token: {
                not: null
              },
              is_notification: true
            },
            select: {
              id: true,
              fcm_token: true
            }
          });
          
          // Determine notification message based on context
          const isKeywordSearch = keywords.length > 0;
          const keywordString = keywords.join(", ");
          const userName = user.user_name || user.full_name || user.business_name || "A user";
          
          // Send notifications to each business asynchronously
          for (const business of businesses) {
            Promise.resolve().then(async () => {
              try {
                // For each service owned by this business
                const businessServices = get_all_services.filter(
                  service => service.business_id === business.id
                );
              
                if (businessServices.length > 0) {
                  // Create notification message
                  const notificationTitle = isKeywordSearch 
                    ? "Service Search Match" 
                    : "Service Viewed";
                  
                  // Add location context to the message
                  let locationContext = "";
                  if (locationSearch) {
                    const locationParts = [];
                    if (searchCity) locationParts.push(`in ${searchCity}`);
                    else if (searchState) locationParts.push(`in ${searchState}`);
                    else if (searchCountry) locationParts.push(`in ${searchCountry}`);
                    
                    if (locationParts.length > 0) {
                      locationContext = ` ${locationParts.join(" ")}`;
                    }
                  }
                  
                  const notificationMessage = isKeywordSearch
                    ? `${userName} needs your service ${locationContext}. Connect`
                    : `${userName} needs your service ${locationContext}. Connect`;
                  
                  // Create notification in database
                  await prisma.notifications.create({
                    data: {
                      title: notificationTitle,
                      message: notificationMessage,
                      metadata: isKeywordSearch 
                        ? `search_view-${keywords.join("-")}-${user.id}` 
                        : `service_view-${businessServices[0].id}-${user.id}`,
                      user_id: business.id,
                      sender_id: user.id,
                      is_read: false
                    }
                  });
                  
                  // Send FCM notification
                  if (business.fcm_token) {
                    const admin = require("@/configs/firebase/firebase.config");
                    const message = {
                      notification: {
                        title: notificationTitle,
                        body: notificationMessage
                      },
                      token: business.fcm_token
                    };
                    
                    admin.messaging().send(message)
                      .then(response => {
                        console.log(`Successfully sent notification to business ${business.id}`);
                      })
                      .catch(error => {
                        console.error(`Error sending FCM notification to business ${business.id}:`, error);
                      });
                  }
                }
              } catch (error) {
                console.error(`Error creating notification for business ${business.id}:`, error);
              }
            });
          }
        }
      } catch (notificationError) {
        console.error("Error processing view notifications:", notificationError);
      }
    }

    // Format results and categorize them by match priority
    const formattedServices = get_all_services.map(service => {
      // Extract location information from service.longitude when it's a string
      let locationDetails = { street: '', city: '', state: '', country: '' };
      if (typeof service.longitude === 'string' && service.longitude.includes('/')) {
        const parts = service.longitude.split('/').map(part => part.trim());
        if (parts.length >= 1) locationDetails.street = parts[0];
        if (parts.length >= 2) locationDetails.city = parts[1];
        if (parts.length >= 3) locationDetails.state = parts[2]; 
        if (parts.length >= 4) locationDetails.country = parts[3];
      }
      
      // Format distance to 2 decimal places when available
      const formattedDistance = service.distance ? parseFloat(service.distance).toFixed(2) : null;
      
      // Extract keywords that matched the search
      const matchedKeywords = [];
      if (keywords.length > 0) {
        const businessKeywords = [
          service.first_key_word, 
          service.second_key_word, 
          service.third_key_word
        ].filter(Boolean);
        
        for (const keyword of keywords) {
          for (const businessKeyword of businessKeywords) {
            if (businessKeyword && businessKeyword.toLowerCase().includes(keyword.toLowerCase())) {
              matchedKeywords.push(businessKeyword);
            }
          }
        }
      }
      
      // Remove the raw keywords and match indicators from the response
      const { 
        first_key_word, 
        second_key_word, 
        third_key_word, 
        street_match,
        city_match,
        state_match,
        country_match,
        ...cleanedService 
      } = service;
      
      return {
        ...cleanedService,
        distance: formattedDistance,
        location_details: locationDetails,
        matched_keywords: matchedKeywords.length > 0 ? matchedKeywords : undefined,
        // Keep match info for categorization
        _match_info: {
          street_match: street_match === 'exact_street_match',
          city_match: city_match === 'exact_city_match',
          state_match: state_match === 'exact_state_match',
          country_match: country_match === 'exact_country_match'
        }
      };
    });
    
    // Categorize results by match criteria (no duplicates, country included in all matches if provided)
    const exactMatches = [];
    const cityMatches = [];
    const stateMatches = [];
    const otherMatches = [];

    if (useCoordinateSearch) {
      otherMatches.push(...formattedServices);
    } else {
      // Track IDs to avoid duplicates
      const exactIds = new Set();
      const cityIds = new Set();

      formattedServices.forEach(service => {
        // Check for exact match (all provided components must match, including country)
        const isExactMatch =
          (!searchCity || service.location_details.city.toLowerCase() === searchCity.toLowerCase()) &&
          (!searchStreet || service.location_details.street.toLowerCase().includes(searchStreet.toLowerCase())) &&
          (!searchState || service.location_details.state.toLowerCase() === searchState.toLowerCase()) &&
          (!searchCountry || service.country.toLowerCase() === searchCountry.toLowerCase());

        if (isExactMatch) {
          exactMatches.push(service);
          exactIds.add(service.id);
          return; // Do not check further, avoid duplicates
        }

        // City match (not already in exact, and country must match if provided)
        if (
          searchCity &&
          service.location_details.city.toLowerCase() === searchCity.toLowerCase() &&
          (!searchCountry || service.country.toLowerCase() === searchCountry.toLowerCase()) &&
          !exactIds.has(service.id)
        ) {
          cityMatches.push(service);
          cityIds.add(service.id);
          return;
        }

        // State match (not already in exact or city, and country must match if provided)
        if (
          searchState &&
          service.location_details.state.toLowerCase() === searchState.toLowerCase() &&
          (!searchCountry || service.country.toLowerCase() === searchCountry.toLowerCase()) &&
          !exactIds.has(service.id) &&
          !cityIds.has(service.id)
        ) {
          stateMatches.push(service);
          return;
        }

        // If not in any above, add to other
        otherMatches.push(service);
      });
    } 
    // Prepare the response with categorized results
    const categorizedResults = {
      exact_matches: exactMatches,
      city_matches: cityMatches,
      state_matches: stateMatches,
      other_matches: otherMatches
    };
    
    const totalMatches = exactMatches.length + cityMatches.length + stateMatches.length + otherMatches.length;
    
    const response = okResponse(
      categorizedResults, 
      `Found ${totalMatches} services (${exactMatches.length} exact, ${cityMatches.length} city, ${stateMatches.length} state)`
    );
    return res.status(response.status.code).json(response);
  } catch (error) {
    console.error("Error in getAllServices:", error);
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const getAllServicesAdmin = async (req, res) => {
  try {
    const get_all_service = await prisma.services.findMany({
      include: {
        service_images: true,
      },
    });
    const response = okResponse(get_all_service, "All Service");
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const getAllMyServices = async (req, res) => {
  const { user } = req.user;

  try {
    const get_all_service = await prisma.services.findMany({
      where: {
        business_id: user.id,
      },
    });
    const response = okResponse(get_all_service, "My All Service");
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const updateService = async (req, res) => {
  const { service_id } = req.params;
  const { service_category_id } = req.body;
  if (service_category_id) {
    const id = service_category_id;
    delete req.body.service_category_id;
    req.body.service_category_id = Number(id);
  }
  try {
    const result = await prisma.services.update({
      where: {
        id: Number(service_id),
      },
      data: {
        ...req.body,
      },
    });
    const response = okResponse(result, "Service Updated");
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const deleteService = async (req, res) => {
  const { service_id } = req.params;
  try {
    const result = await prisma.services.delete({
      where: {
        id: Number(service_id),
      },
    });
    const response = okResponse(result, "Service Deleted");
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};







// Modify your getAllServices function or create a new searchServices function
const searchServices = async (req, res) => {
  let {
    longitude,
    latitude,
    radius,
    first_key_word,
    second_key_word,
    third_key_word,
  } = req.query;
  const { user } = req.user;
  
  // Collect keywords for notification
  const keywords = [];
  if (first_key_word) keywords.push(first_key_word);
  if (second_key_word) keywords.push(second_key_word);
  if (third_key_word) keywords.push(third_key_word);
  
  radius = radius || 10;
  try {
    let get_all_services;

    if (first_key_word) {
      get_all_services =
      await prisma.$queryRaw`SELECT s.id,s.longitude,s.latitude,s.service_name,s.description,s.country,bu.business_name,bu.email,bu.address,bu.id as business_id,
      bu.profile_picture as business_image,bu.phone, (SELECT si.image FROM service_images as si WHERE si.service_id = s.id LIMIT 1) as service_image, 
      CAST((6371 * acos(
      cos(radians(${latitude})) * cos(radians(s.latitude)) *
      cos(radians(s.longitude) - radians(${longitude})) +
      sin(radians(${latitude})) * sin(radians(s.latitude))
    )) AS FLOAT) AS distance FROM services as s JOIN service_categories as sc ON sc.id = s.service_category_id JOIN users as bu ON bu.id = s.business_id WHERE (6371 * acos(
        cos(radians(${latitude})) * cos(radians(s.latitude)) *
        cos(radians(s.longitude) - radians(${longitude})) +
        sin(radians(${latitude})) * sin(radians(s.latitude))
      )) <= ${radius} AND s.is_active= ${true} AND bu.first_key_word LIKE ${
        "%" + first_key_word + "%"
      } AND sc.is_active = ${true} ORDER BY distance DESC`;
    } else if (second_key_word) {
      get_all_services =
      await prisma.$queryRaw`SELECT s.id,s.longitude,s.latitude,s.service_name,s.description,s.country,bu.business_name,bu.email,bu.address,bu.id as business_id,
      bu.profile_picture as business_image,bu.phone, (SELECT si.image FROM service_images as si WHERE si.service_id = s.id LIMIT 1) as service_image, 
      CAST((6371 * acos(
      cos(radians(${latitude})) * cos(radians(s.latitude)) *
      cos(radians(s.longitude) - radians(${longitude})) +
      sin(radians(${latitude})) * sin(radians(s.latitude))
    )) AS FLOAT) AS distance FROM services as s JOIN service_categories as sc ON sc.id = s.service_category_id JOIN users as bu ON bu.id = s.business_id WHERE (6371 * acos(
        cos(radians(${latitude})) * cos(radians(s.latitude)) *
        cos(radians(s.longitude) - radians(${longitude})) +
        sin(radians(${latitude})) * sin(radians(s.latitude))
      )) <= ${radius} AND s.is_active= ${true} AND bu.second_key_word LIKE ${
        "%" + second_key_word + "%"
      } AND sc.is_active = ${true} ORDER BY distance DESC`;
    } else if (third_key_word) {
      get_all_services =
      await prisma.$queryRaw`SELECT s.id,s.longitude,s.latitude,s.service_name,s.description,s.country,bu.business_name,bu.email,bu.address,bu.id as business_id,
      bu.profile_picture as business_image,bu.phone, (SELECT si.image FROM service_images as si WHERE si.service_id = s.id LIMIT 1) as service_image, 
      CAST((6371 * acos(
      cos(radians(${latitude})) * cos(radians(s.latitude)) *
      cos(radians(s.longitude) - radians(${longitude})) +
      sin(radians(${latitude})) * sin(radians(s.latitude))
    )) AS FLOAT) AS distance FROM services as s JOIN service_categories as sc ON sc.id = s.service_category_id JOIN users as bu ON bu.id = s.business_id WHERE (6371 * acos(
        cos(radians(${latitude})) * cos(radians(s.latitude)) *
        cos(radians(s.longitude) - radians(${longitude})) +
        sin(radians(${latitude})) * sin(radians(s.latitude))
      )) <= ${radius} AND s.is_active= ${true} AND bu.third_key_word LIKE ${
        "%" + third_key_word + "%"
      } AND sc.is_active = ${true} ORDER BY distance DESC`;
    } else {
      get_all_services =
      await prisma.$queryRaw`SELECT s.id,s.longitude,s.latitude,s.service_name,s.description,s.country,bu.business_name,bu.email,bu.address,bu.id as business_id,
      bu.profile_picture as business_image,bu.phone, (SELECT si.image FROM service_images as si WHERE si.service_id = s.id LIMIT 1) as service_image, 
      CAST((6371 * acos(
      cos(radians(${latitude})) * cos(radians(s.latitude)) *
      cos(radians(s.longitude) - radians(${longitude})) +
      sin(radians(${latitude})) * sin(radians(s.latitude))
    )) AS FLOAT) AS distance FROM services as s JOIN service_categories as sc ON sc.id = s.service_category_id JOIN users as bu ON bu.id = s.business_id WHERE (6371 * acos(
        cos(radians(${latitude})) * cos(radians(s.latitude)) *
        cos(radians(s.longitude) - radians(${longitude})) +
        sin(radians(${latitude})) * sin(radians(s.latitude))
      )) <= ${radius} AND s.is_active= ${true} AND sc.is_active = ${true} ORDER BY distance DESC`;
    }

    // After getting search results, identify matching service providers
    const matchingBusinessIds = Array.from(new Set(get_all_services.map(service => service.business_id)));
    
    // Get FCM tokens for these businesses
    const businessTokens = await prisma.users.findMany({
      where: {
        id: {
          in: matchingBusinessIds,
        },
        user_type: "BUSINESS",
        is_notification: true,
        fcm_token: {
          not: null
        }
      },
      select: {
        id: true,
        fcm_token: true,
      }
    });
    
    // Send notifications to each matching business
    businessTokens.forEach(async (business) => {
      await sendServiceSearchNotification({
        token: business.fcm_token,
        business_id: business.id,
        user,
        keywords,
      });
    });
    
    const response = okResponse(get_all_services, "Service Search Results");
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};











module.exports = {
  createService,
  getAllServices,
  getAllMyServices,
  updateService,
  deleteService,
  getAllServicesAdmin,
};
