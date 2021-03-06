import urlMetadata from "url-metadata";
import followsRepository from "../repositories/followsRepository.js";
import userRepository from "../repositories/userRepository.js";
import postsRepository from "./../repositories/postsRepository.js";

export async function getPosts(req, res) {
  try {
    const { user } = res.locals;
    const allPosts = await postsRepository.getFollowedPosts(user.id);

    const limit = 10;
    if (allPosts.rowCount === 0) {
      res.sendStatus(204);
      return;
    }
    // else if (allPosts.rowCount <= limit) {
    //   res.status(200).send(allPosts.rows);
    //   return;
    // }

    const { page } = req.query;
    const start = (page - 1) * limit;
    const end = page * limit;

    //const start = 0;
    //const end = limit;

    res.status(200).send(allPosts.rows.splice(start, end));
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
}

export async function getNewPosts(req, res) {
  let { id } = req.params;

  try {
    const { user } = res.locals;
    const response = await postsRepository.getFollowedNewPosts(user.id, id);

    const limit = 20;
    if (response.rowCount === 0) {
      res.sendStatus(204);
      return;
    } else if (response.rowCount <= limit) {
      res.status(200).send(response.rows);
      return;
    }

    //const { page } = req.query;
    //const start = (page - 1) * limit;
    //const end = page * limit;

    const start = 0;
    const end = limit;

    res.status(200).send(response.rows.splice(start, end));
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
}

export async function getPostsByHashtag(req, res) {
  const { hashtag } = req.params;
  try {
    const filteredPosts = await postsRepository.filterPostsByHashtag(hashtag);
    //console.log(filteredPosts);

    const limit = 20;
    if (filteredPosts.rowCount === 0) {
      res.sendStatus(204);
      return;
    } else if (filteredPosts.rowCount <= limit) {
      res.status(200).send(filteredPosts.rows);
      return;
    }

    //const { page } = req.query;
    //const start = (page - 1) * limit;
    //const end = page * limit;

    const start = 0;
    const end = limit;

    res.status(200).send(filteredPosts.rows.splice(start, end));
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
}

export async function getPostsByUser(req, res) {
  const { id } = req.params;

  try {
    const userPosts = await postsRepository.filterPostsByUser(id);

    const limit = 20;
    if (userPosts.rowCount === 0) {
      res.sendStatus(204);
      return;
    } else if (userPosts.rowCount <= limit) {
      res.status(200).send(userPosts.rows);
      return;
    }

    //const { page } = req.query;
    //const start = (page - 1) * limit;
    //const end = page * limit;

    const start = 0;
    const end = limit;

    res.status(200).send(userPosts.rows.splice(start, end));
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
}

export async function publishPost(req, res, next) {
  try {
    const user = res.locals.user;
    const { link, description } = req.body;

    const metadata = await urlMetadata(link);
    const {
      title: titleLink,
      image: imageLink,
      description: linkDescription,
    } = metadata;

    const result = await postsRepository.insertPost(
      user.id,
      link,
      description,
      titleLink,
      imageLink,
      linkDescription
    );

    const postId = result.rows[0].id;

    res.locals.postId = postId;
    res.locals.postDescription = description;
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }

  next();
}

export async function deletePost(req, res) {
  try {
    const { id } = req.params;

    const post = await postsRepository.findPost(id);
    if (post.rowCount === 0) {
      return res.sendStatus(404);
    }

    await postsRepository.deletePost(id);
    return res.sendStatus(204);
  } catch (error) {
    console.log(error.message);
    return res.sendStatus(500);
  }

  next();
}

export async function editPost(req, res) {
  try {
    const { id } = req.params;
    const { description } = req.body;

    const post = await postsRepository.findPost(id);
    if (post.rowCount === 0) {
      return res.sendStatus(404);
    }

    await postsRepository.updateDescription(id, description);
    return res.sendStatus(204);
  } catch (error) {
    console.log(error.message);
    return res.sendStatus(500);
  }
}

export async function likePost(req, res) {
  try {
    const { idPost } = req.body;
    const user = res.locals.user;
    await postsRepository.toggleLikePost(user.id, idPost);
    return res.sendStatus(201);
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
}

export async function checkPostLikes(req, res) {
  const { idPost } = req.body;
  const user = res.locals.user;
  const checkForLikes = await postsRepository.checkLike(user.id, idPost);

  if (checkForLikes.rowCount === 0) {
    return res.status(200).send(false);
  } else {
    return res.status(200).send(true);
  }
}

export async function countLikes(req, res) {
  try {
    const { id } = req.params;
    const count = await postsRepository.countLikes(id);
    const users = await postsRepository.lastUserLikes(id, res.locals.user.id);
    return res.status(200).send({
      count: count.rows[0].count,
      users: users.rows.map((item) => {
        return item.username;
      }),
    });
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
}

export async function getSearchedUser(req, res) {
  try {
    const user = req.query.user;
    const { user: loggedUser } = res.locals;
    const limit = 2;
    if (user.length >= 3) {
      const queryUsers = await userRepository.searchUsers(loggedUser.id, user);
      return res.status(200).send(queryUsers.rows.splice(0, limit));
    } else {
      return res.sendStatus(200);
    }
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
}

export async function addComment(req, res) {
  try {
    const { id: idUser } = res.locals.user;
    const { idPost, comment } = req.body;

    const newComment = await postsRepository.insertComment(
      idUser,
      idPost,
      comment
    );
    return res.sendStatus(200);
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
}

export async function countShares(req, res) {
  try {
    const { id } = req.params;
    const post = await postsRepository.findPost(id);
    if (post.rowCount === 0) {
      return res.sendStatus(404);
    }

    const user = await userRepository.userById(post.rows[0].idUser);

    const count = await postsRepository.countShares(id);
    return res.status(200).send({
      count: count.rows[0].count,
      user: {
        id: user.rows[0].id,
        username: user.rows[0].username,
        picture: user.rows[0].picture,
      },
    });
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
}

export async function sharePost(req, res) {
  try {
    const { idPost } = req.body;
    const user = res.locals.user;

    const post = await postsRepository.findPost(idPost);
    if (post.rowCount === 0) {
      return res.sendStatus(404);
    }

    const exist = await postsRepository.shareExist(user.id, post.rows[0].id);
    if (exist.rows[0].count === 0) {
      return res.sendStatus(409);
    }

    await postsRepository.sharePost(user.id, post.rows[0]);
    return res.sendStatus(201);
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
}

export async function getComments(req, res) {
  try {
    const user = res.locals.user;
    const { id: idPost } = req.params;
    const postComments = await postsRepository.getComments(idPost);
    const arrayFollowers = await followsRepository.getAllFollowedArray(user.id);

    postComments.rows.map((comment) => {
      if (comment.idUser === comment.postAuthor) {
        comment.type = "post's author";
      } else if (arrayFollowers.rows[0].array.includes(comment.idUser)) {
        comment.type = "following";
      } else {
        comment.type = "";
      }
    });
    console.log();
    return res.status(200).send(postComments.rows);
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
}

export async function countComments(req, res) {
  try {
    const { id: idPost } = req.params;
    const postComments = await postsRepository.countComments(idPost);
    return res.status(200).send(postComments.rows[0].count);
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
}
