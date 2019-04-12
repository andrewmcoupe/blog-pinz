import React from "react";

function withAndy(Component) {
	function WithAndy() {
		return (
			<div class="god wrapper">
				<Component andy="a god" />
			</div>
		);
	}
	return WithAndy;
}

export default withAndy;
