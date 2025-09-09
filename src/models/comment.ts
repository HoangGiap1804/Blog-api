/**
 * Node modules
 */
import { Schema, model, Types } from 'mongoose';

export interface IComment {
  blogId: Types.ObjectId;
  userId: Types.ObjectId;
  comment: string;
}

const commentSchema = new Schema<IComment>({
  blogId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  comment: {
    type: String,
    required: [true, 'Comment is required'],
    maxLength: [1000, 'Comment must be less than 1000 characters'],
  },
});

export default model<IComment>('Comment', commentSchema);
