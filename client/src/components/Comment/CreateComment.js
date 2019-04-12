import React, { useState, useContext } from "react";
import { withStyles, Icon } from "@material-ui/core";
import InputBase from "@material-ui/core/InputBase";
import IconButton from "@material-ui/core/IconButton";
import ClearIcon from "@material-ui/icons/Clear";
import SendIcon from "@material-ui/icons/Send";
import Divider from "@material-ui/core/Divider";

import { CREATE_COMMENT_MUTATION } from "../../graphql/mutations";
import { useClient } from "../../graphqlClient";
import Context from "../../context";

const CreateComment = ({ classes }) => {
	const client = useClient();
	const { state } = useContext(Context);

	const [comment, setComment] = useState("");

	async function handleSubmitComment() {
		const variables = {
			pinId: state.currentPin._id,
			text: comment
		};

		await client.request(CREATE_COMMENT_MUTATION, variables);

		// dispatch({ type: "CREATE_COMMENT", payload: createComment });
		setComment("");
	}

	return (
		<React.Fragment>
			<form className={classes.form} onSubmit={handleSubmitComment}>
				<IconButton
					onClick={() => setComment("")}
					disabled={!comment.trim()}
					className={classes.clearButton}
				>
					<ClearIcon />
				</IconButton>
				<InputBase
					multiline={true}
					className={classes.input}
					placeholder="Add comment"
					onChange={e => setComment(e.target.value)}
					value={comment}
				/>
				<IconButton
					className={classes.sendButton}
					onClick={handleSubmitComment}
				>
					<SendIcon />
				</IconButton>
			</form>
			<Divider />
		</React.Fragment>
	);
};

const styles = theme => ({
	form: {
		display: "flex",
		alignItems: "center"
	},
	input: {
		marginLeft: 8,
		flex: 1
	},
	clearButton: {
		padding: 0,
		color: "red"
	},
	sendButton: {
		padding: 0,
		color: theme.palette.secondary.dark
	}
});

export default withStyles(styles)(CreateComment);
