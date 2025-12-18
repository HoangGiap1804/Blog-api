/**
 * Node module
 */
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

/**
 * Custom module
 */
import { logger } from '@/lib/winston';

/**
 * Modles
 */
import User from '@/models/user';
import Blog from '@/models/blog';

/**
 * Types
 */
import type { Request, Response } from 'express';
import type { IBlog } from '@/models/blog';
type BlogData = Partial<Pick<IBlog, 'title' | 'content' | 'banner' | 'status'>>;

/**
 * Purify the blog content
 */
const window = new JSDOM('').window;
const purify = DOMPurify(window);

const updateBlogByID = async (req: Request, res: Response): Promise<void> => {
  const blogId = req.params.blogId;
  const userId = req.userId;
  const role = req.role;
  const { title, content, status, banner } = req.body;

  try {
    const blog = await Blog.findById(blogId).select('-__v').exec();
    if (!blog) {
      res.status(404).json({
        code: 'NotFound',
        message: 'Blog not found',
      });
      return;
    }
    logger.info("blog user id", blog.author._id.toString());
    logger.info("user id", userId);
    if (role !== 'admin' && blog.author._id.toString() !== userId?.toString()) {
      res.status(403).json({
        code: 'AuthorizationError',
        message: 'Access denied, insufficient permission',
      });

      logger.warn(
        'A user tried to update a blog without permission',
        userId,
        blog,
      );
      return;
    }
    if (title) blog.title = purify.sanitize(title);
    if (content) blog.content = purify.sanitize(content);
    if (status) blog.status = status;
    if (banner) blog.banner = banner;

    await blog.save();
    logger.info('Blog is updated successfully', blog);
    res.status(200).json({ blog });
  } catch (err) {
    res.status(500).json({
      code: 'ServerError',
      message: 'Internal server error',
      error: err,
    });

    logger.error('Error while updating blog', err);
  }
};

export default updateBlogByID;
