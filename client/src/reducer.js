export default function reducer(state, { type, payload }) {
	switch (type) {
		case "LOGIN_USER":
			return {
				...state,
				currentUser: payload
			};
		case "IS_LOGGED_IN":
			return {
				...state,
				isAuth: payload
			};
		case "SIGNOUT_USER":
			return {
				...state,
				currentUser: null,
				isAuth: false
			};
		case "CREATE_DRAFT":
			return {
				...state,
				currentPin: null,
				draft: {
					latitude: 0,
					longitude: 0
				}
			};
		case "REMOVE_DRAFT":
			return {
				...state,
				draft: null
			};
		case "UPDATE_DRAFT_LOCATION":
			return {
				...state,
				draft: payload
			};
		case "GET_PINS":
			return {
				...state,
				pins: payload
			};
		case "CREATE_PIN":
			const newPin = payload;
			const prevPins = state.pins.filter(pin => pin._id !== newPin._id);
			return {
				...state,
				pins: [...prevPins, newPin]
			};
		case "SET_PIN":
			return {
				...state,
				currentPin: payload,
				draft: null
			};
		case "DELETE_PIN":
			const filteredPins = state.pins.filter(pin => pin._id !== payload._id);
			if (state.currentPin) {
				const isCurrentPin = payload._id === state.currentPin._id;

				if (isCurrentPin) {
					return {
						...state,
						pins: filteredPins,
						currentPin: null
					};
				}
			}
			return {
				...state,
				pins: filteredPins
			};
		case "CREATE_COMMENT":
			const updatedPins = state.pins.map(pin =>
				pin._id === payload._id ? payload : pin
			);
			return {
				...state,
				pins: updatedPins,
				currentPin: payload
			};
		default:
			return state;
	}
}
