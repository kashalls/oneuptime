import mongoose from '../utils/ORM';

const Schema = mongoose.Schema;
const externalStatusPageSchema = new Schema(
    {
        name: String,
        url: URL,
        description: String,
        statusPageId: {
            type: Schema.Types.ObjectId,
            ref: 'StatusPage',
            index: true,
        },
        projectId: {
            type: Schema.Types.ObjectId,
            ref: 'Project',
            index: true,
        },
        deleted: {
            type: Boolean,
            default: false,
        },
        deletedAt: {
            type: Date,
        },
        deletedById: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            index: true,
        },
        createdById: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            index: true,
        },
    },
    { timestamps: true }
);
export default mongoose.model('ExternalStatusPage', externalStatusPageSchema);
