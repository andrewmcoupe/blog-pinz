const { AuthenticationError, PubSub } = require("apollo-server");
const Pin = require("./models/Pin");

const pubSub = new PubSub();
const PIN_ADDED = "PIN_ADDED";
const PIN_DELETED = "PIN_DELETED";
const PIN_UPDATED = "PIN_UPDATED";

const authenticated = next => (root, args, ctx, info) => {
	if (!ctx.currentUser) {
		throw new AuthenticationError();
	}

	return next(root, args, ctx, info);
};

module.exports = {
	Query: {
		me: authenticated((root, args, ctx, info) => ctx.currentUser),
		getPins: async (root, args, ctx) => {
			const pins = await Pin.find({})
				.populate("author")
				.populate("comments.author");

			return pins;
		}
	},
	Mutation: {
		createPin: authenticated(async (root, args, ctx) => {
			const newPin = await new Pin({
				...args.input,
				author: ctx.currentUser._id
			}).save();

			const pinAdded = await Pin.populate(newPin, "author");

			pubSub.publish(PIN_ADDED, { pinAdded });

			return pinAdded;
		}),
		deletePin: authenticated(async (root, args, ctx) => {
			const deletedPin = await Pin.findByIdAndDelete({
				_id: args.pinId
			}).exec();

			pubSub.publish(PIN_DELETED, { deletePin });

			return deletedPin;
		}),
		createComment: authenticated(async (root, args, ctx) => {
			const newComment = { text: args.text, author: ctx.currentUser._id };
			const updatedPin = await Pin.findOneAndUpdate(
				{ _id: args.pinId },
				{ $push: { comments: newComment } },
				{ new: true }
			)
				.populate("author")
				.populate("comments.author");

			pubSub.publish(PIN_UPDATED, { updatedPin });

			return updatedPin;
		})
	},
	Subscription: {
		pinAdded: {
			subscribe: () => pubSub.asyncIterator(PIN_ADDED)
		},
		pinDeleted: {
			subscribe: () => pubSub.asyncIterator(PIN_DELETED)
		},
		pinUpdated: {
			subscribe: () => pubSub.asyncIterator(PIN_UPDATED)
		}
	}
};
