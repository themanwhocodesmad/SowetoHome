import { Schema, model, Types, type HydratedDocument } from 'mongoose';

export interface ISavedProperty {
  userId: Types.ObjectId;
  propertyId: Types.ObjectId;
  createdAt: Date;
}

export type SavedPropertyDocument = HydratedDocument<ISavedProperty>;

const savedPropertySchema = new Schema<ISavedProperty>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// A user can only save the same property once.
savedPropertySchema.index({ userId: 1, propertyId: 1 }, { unique: true });

export const SavedPropertyModel = model<ISavedProperty>('SavedProperty', savedPropertySchema);
