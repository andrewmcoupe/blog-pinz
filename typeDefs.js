const { gql } = require("apollo-server");

module.exports = gql`
	type User {
		_id: ID
		name: String
		email: String
		picture: String
	}

	type Pin {
		_id: ID!
		createdAt: String!
		title: String!
		content: String
		image: String
		latitude: Float!
		longitude: Float!
		author: User!
		comments: [Comment]
	}

	type Comment {
		text: String
		createdAt: String
		author: User
	}

	input CreatePinInput {
		title: String
		image: String
		content: String
		latitude: Float
		longitude: Float
	}

	input CreateCommentInput {
		content: String!
	}

	type Query {
		me: User
		getPins: [Pin!]
	}

	type Subscription {
		pinAdded: Pin
		pinDeleted: Pin
		pinUpdated: Pin
	}

	type Mutation {
		createPin(input: CreatePinInput!): Pin
		deletePin(pinId: ID!): Pin
		createComment(pinId: ID!, text: String): Pin
	}
`;
