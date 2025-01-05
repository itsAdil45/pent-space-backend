/** @format */

const sendLikeFeedNotification = require("@/notifications/like_feed");
const { prisma } = require("../../configs/prisma");

const {
  serverErrorResponse,
  okResponse,
  badRequestResponse,
} = require("../../constants/responses");
const sendCommentFeedNotification = require("@/notifications/comment_feed");

const createFeed = async (req, res) => {
  const { user } = req.user;
  const { feed_picture } = req;
  try {
    const result = await prisma.feeds.create({
      data: {
        ...req.body,
        user_id: user.id,
        feed_images: {
          createMany: {
            data: feed_picture.map((url) => ({
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

const likeFeed = async (req, res) => {
  const { user } = req.user;
  const { feed_id } = req.body;

  try {
    const feed = await prisma.feeds.findFirst({
      where: {
        id: Number(feed_id),
      },
      include: {
        users: true,
      },
    });
    const like = await prisma.feed_likes.findFirst({
      where: {
        feed_id: Number(feed_id),
        user_id: user.id,
      },
    });
    if (like) {
      await prisma.feed_likes.delete({
        where: {
          id: like.id,
        },
      });
      await sendLikeFeedNotification({
        feed_id,
        user_id: feed.users.id,
        like: true,
        user,
        token: feed.users.fcm_token,
      });
    } else {
      await prisma.feed_likes.create({
        data: {
          feed_id: Number(feed_id),
          user_id: user.id,
        },
      });
      console.log("test1");
      await sendLikeFeedNotification({
        feed_id,
        user_id: feed.users.id,
        like: true,
        user,
        token: feed.users.fcm_token,
      });
    }
    const response = okResponse(null, `${like ? "Unliked" : "Liked"}`);
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const commentFeed = async (req, res) => {
  const { user } = req.user;
  const { feed_id, comment_text } = req.body;

  try {
    const result = await prisma.feed_comments.create({
      data: {
        feed_id: Number(feed_id),
        user_id: user.id,
        comment_text,
      },
      select: {
        comment_text: true,
        user_id: true,
        feed_id: true,
        createdAt: true,
        id: true,
        users: {
          select: {
            id: true,
            user_name: true,
            profile_picture: true,
            business_name: true,
            fcm_token: true,
          },
        },
        feeds: {
          include: {
            users: {
              select: {
                fcm_token: true,
              },
            },
          },
        },
      },
    });
    console.log(result);

    await sendCommentFeedNotification({
      feed_id,
      user_id: result.feeds.user_id,
      token: result.feeds.users.fcm_token,
      user,
    });

    const user_data = result.users;
    if (user_data.user_name) {
      delete user_data.business_name;
    } else {
      user_data.user_name = user_data.business_name;
      delete user_data.business_name;
    }
    delete result.users;

    const response = okResponse(
      { ...result, ...user_data },
      "A new comment added"
    );
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const deleteComment = async (req, res) => {
  const { comment_id } = req.params;
  const { user } = req.user;

  try {
    const result = await prisma.feed_comments.delete({
      where: {
        id: Number(comment_id),
        user_id: user.id,
      },
    });
    const response = okResponse(result, "Comment Deleted");
    return res.status(response.status.code).json(response);
  } catch (error) {
    if (error.meta.cause == "Record to delete does not exist.") {
      const response = badRequestResponse(
        "Record to delete does not exist or you don't have access to deleted"
      );
      return res.status(response.status.code).json(response);
    }
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const getAllFeeds = async (req, res) => {
  const { user } = req.user;
  try {
    const get_all_feed =
      await prisma.$queryRaw`SELECT f.id,f.user_id,f.createdAt,f.about,fi.image,
      CASE WHEN (SELECT CAST(COUNT(id) AS FLOAT) FROM feed_likes WHERE user_id = ${user.id} AND feed_id = f.id) > 0 THEN 1 ELSE 0 END AS is_liked, 
      CASE WHEN u.user_type = "BUSINESS" THEN u.business_name ELSE u.full_name END AS user_name,u.profile_picture,
      (SELECT CAST(COUNT(id) AS FLOAT) FROM feed_comments WHERE feed_id = f.id) AS total_comments,
      (SELECT CAST(COUNT(id) AS FLOAT) FROM feed_likes WHERE feed_id = f.id) AS total_likes FROM feeds AS f 
      JOIN users AS u ON u.id = f.user_id JOIN feed_images AS fi ON fi.feed_id=f.id ORDER BY f.createdAt DESC`;

    const serialized_feed = get_all_feed.map((feed) => ({
      ...feed,
      id: feed.id.toString(),
      user_id: feed.user_id.toString(),
      is_liked: feed.is_liked.toString() == 1 ? true : false,
      createdAt: feed.createdAt.toISOString(),
      total_comments: feed.total_comments.toString(),
      total_likes: feed.total_likes.toString(),
    }));

    const response = okResponse(serialized_feed, "All Feeds");
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const getAllFeedsAdmin = async (req, res) => {
  try {
    const get_all_feed =
      await prisma.$queryRaw`SELECT f.id,f.user_id,f.createdAt,f.about,fi.image,
      CASE WHEN u.user_type = "BUSINESS" THEN u.business_name ELSE u.full_name END AS user_name,u.profile_picture,
      (SELECT CAST(COUNT(id) AS FLOAT) FROM feed_comments WHERE feed_id = f.id) AS total_comments,
      (SELECT CAST(COUNT(id) AS FLOAT) FROM feed_likes WHERE feed_id = f.id) AS total_likes FROM feeds AS f 
      JOIN users AS u ON u.id = f.user_id JOIN feed_images AS fi ON fi.feed_id=f.id ORDER BY f.createdAt DESC`;

    const serialized_feed = get_all_feed.map((feed) => ({
      ...feed,
      id: feed.id.toString(),
      user_id: feed.user_id.toString(),
      createdAt: feed.createdAt.toISOString(),
      total_comments: feed.total_comments.toString(),
      total_likes: feed.total_likes.toString(),
    }));

    const response = okResponse(serialized_feed, "All Feeds");
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const getFeedById = async (req, res) => {
  const { feed_id } = req.params;
  const { user } = req.user;
  try {
    const get_feed_by_id =
      await prisma.$queryRaw`SELECT f.id,f.user_id,f.createdAt,f.about,fi.image,
      CASE WHEN (SELECT CAST(COUNT(id) AS FLOAT) FROM feed_likes WHERE user_id = ${user.id} AND feed_id = f.id)>0 THEN 1 ELSE 0 END AS is_liked, 
      CASE WHEN u.user_type = "BUSINESS" THEN u.business_name ELSE u.full_name END AS user_name,u.profile_picture,
      (SELECT CAST(COUNT(id) AS FLOAT) FROM feed_comments WHERE feed_id = f.id) AS total_comments,
      (SELECT CAST(COUNT(id) AS FLOAT) FROM feed_likes WHERE feed_id = f.id) AS total_likes FROM feeds AS f 
      JOIN users AS u ON u.id = f.user_id JOIN feed_images AS fi ON fi.feed_id=f.id WHERE f.id=${feed_id}`;

    console.log(get_feed_by_id);

    const comments =
      await prisma.$queryRaw`SELECT fc.id,fc.user_id,fc.comment_text,fc.createdAt, CASE WHEN u.user_type = "BUSINESS" THEN u.business_name ELSE u.full_name END AS user_name,u.profile_picture FROM feed_comments AS fc JOIN users AS u ON u.id=fc.user_id WHERE fc.feed_id=${feed_id} ORDER BY fc.createdAt DESC`;

    const likes =
      await prisma.$queryRaw`SELECT fl.id,fl.user_id,fl.createdAt, CASE WHEN u.user_type = "BUSINESS" THEN u.business_name ELSE u.full_name END AS user_name,u.profile_picture FROM feed_likes AS fl JOIN users AS u ON u.id=fl.user_id WHERE fl.feed_id=${feed_id} ORDER BY fl.createdAt DESC`;

    const response = okResponse(
      {
        get_feed_by_id: {
          ...get_feed_by_id[0],
          user_id: get_feed_by_id[0].user_id.toString(),
          is_liked: get_feed_by_id[0].is_liked.toString() == 1 ? true : false,
          createdAt: get_feed_by_id[0].createdAt.toISOString(),
          total_comments: get_feed_by_id[0].total_comments.toString(),
          total_likes: get_feed_by_id[0].total_likes.toString(),
        },
        comments,
        likes,
      },
      "Feed Details"
    );
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const getMyFeeds = async (req, res) => {
  const { user } = req.user;
  try {
    const get_all_feed =
      await prisma.$queryRaw`SELECT f.id,f.user_id,f.createdAt,f.about,fi.image,
      CASE WHEN (SELECT CAST(COUNT(id) AS FLOAT) FROM feed_likes WHERE user_id = ${user.id} AND feed_id = f.id)>0 THEN 1 ELSE 0 END AS is_liked, 
      CASE WHEN u.user_type = "BUSINESS" THEN u.business_name ELSE u.full_name END AS user_name,u.profile_picture,
      (SELECT CAST(COUNT(id) AS FLOAT) FROM feed_comments WHERE feed_id = f.id) AS total_comments,
      (SELECT CAST(COUNT(id) AS FLOAT) FROM feed_likes WHERE feed_id = f.id) AS total_likes FROM feeds AS f 
      JOIN users AS u ON u.id = f.user_id JOIN feed_images AS fi ON fi.feed_id=f.id WHERE f.user_id = ${user.id} ORDER BY f.createdAt DESC`;

    const serialized_feed = get_all_feed.map((feed) => ({
      ...feed,
      id: feed.id.toString(),
      user_id: feed.user_id.toString(),
      is_liked: feed.is_liked.toString() == 1 ? true : false,
      createdAt: feed.createdAt.toISOString(),
      total_comments: feed.total_comments.toString(),
      total_likes: feed.total_likes.toString(),
    }));

    const response = okResponse(serialized_feed, "My Feeds");
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const deleteFeed = async (req, res) => {
  const { feed_id } = req.params;
  const { user } = req.user;

  try {
    const result = await prisma.feeds.delete({
      where: {
        id: Number(feed_id),
        user_id: user.id,
      },
    });
    const response = okResponse(result, "Feed Deleted");
    return res.status(response.status.code).json(response);
  } catch (error) {
    if (error.meta.cause == "Record to delete does not exist.") {
      const response = badRequestResponse(
        "Record to delete does not exist or you don't have access to deleted."
      );
      return res.status(response.status.code).json(response);
    }
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

module.exports = {
  createFeed,
  getAllFeeds,
  deleteFeed,
  getMyFeeds,
  likeFeed,
  commentFeed,
  deleteComment,
  getFeedById,
  getAllFeedsAdmin,
};
