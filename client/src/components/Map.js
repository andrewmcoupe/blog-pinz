import React, { useState, useEffect, useContext } from "react";
import ReactMapGL, { NavigationControl, Marker, Popup } from "react-map-gl";
import { withStyles } from "@material-ui/core/styles";
import differenceInMinutes from "date-fns/difference_in_minutes";
import PinIcon from "./PinIcon";
import Blog from "../components/Blog";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import DeleteIcon from "@material-ui/icons/DeleteTwoTone";
import { unstable_useMediaQuery as useMediaQuery } from "@material-ui/core/useMediaQuery";

import { Subscription } from "react-apollo";

import { useClient } from "../graphqlClient";
import { GET_PINS_QUERY } from "../graphql/queries";
import { DELETE_PIN_MUTATION } from "../graphql/mutations";
import {
	PIN_ADDED_SUBSCRIPTION,
	PIN_UPDATED_SUBSCRIPTION,
	PIN_DELETED_SUBSCRIPTION
} from "../graphql/subscriptions";
import Context from "../context";

const initialViewport = {
	latitude: 37.7577,
	longitude: -122.4376,
	zoom: 13
};

const Map = ({ classes }) => {
	const mobileSize = useMediaQuery("(max-width: 650px)");
	const client = useClient();
	const { state, dispatch } = useContext(Context);

	useEffect(() => {
		getPins();
	}, []);

	const [viewport, setViewport] = useState(initialViewport);
	const [userPosition, setUserPosition] = useState(null);

	useEffect(() => {
		getUserPosition();
	}, []);

	const [popup, setPopup] = useState(null);
	// remove popup if pin is deleted by pin author
	useEffect(() => {
		const pinExists =
			popup && state.pins.findIndex(pin => pin._id === popup._id) > -1;

		if (!pinExists) {
			setPopup(null);
		}
	}, [state.pins.length]);

	async function getPins() {
		const { getPins } = await client.request(GET_PINS_QUERY);
		dispatch({ type: "GET_PINS", payload: getPins });
	}

	async function handleDeletePin(pin) {
		const variables = { pinId: pin._id };
		await client.request(DELETE_PIN_MUTATION, variables);

		// dispatch({ type: "DELETE_PIN", payload: deletePin });
		setPopup(null);
	}

	function getUserPosition() {
		if ("geolocation" in navigator) {
			navigator.geolocation.getCurrentPosition(position => {
				const { latitude, longitude } = position.coords;

				setViewport({ ...viewport, latitude, longitude });
				setUserPosition({ latitude, longitude });
			});
		}
	}

	function handleMapClick({ lngLat, leftButton }) {
		if (!leftButton) return;

		if (!state.draft) {
			dispatch({ type: "CREATE_DRAFT" });
		}

		const [longitude, latitude] = lngLat;
		dispatch({
			type: "UPDATE_DRAFT_LOCATION",
			payload: { longitude, latitude }
		});
	}

	function highlightNewPin(pin) {
		const isNewPin =
			differenceInMinutes(Date.now(), Number(pin.createdAt)) <= 30;

		return isNewPin ? "limegreen" : "darkblue";
	}

	function handleSelectPin(pin) {
		setPopup(pin);

		dispatch({ type: "SET_PIN", payload: pin });
	}

	function isAuthUser() {
		console.log({
			currentUser: state.currentUser,
			popupAuthor: popup.author._id
		});
		return state.currentUser._id === popup.author._id;
	}

	return (
		<div className={mobileSize ? classes.rootMobile : classes.root}>
			<ReactMapGL
				{...viewport}
				onClick={handleMapClick}
				onViewportChange={newViewport => setViewport(newViewport)}
				width="100vw"
				height="calc(100vh - 64px)"
				scrollZoom={!mobileSize}
				mapStyle="mapbox://styles/mapbox/streets-v9"
				mapboxApiAccessToken="pk.eyJ1IjoiYW5kcmV3bWNvdXBlIiwiYSI6ImNqdTd3cm1rbzAxa3UzeXBlY3d1NXFsdTgifQ.5jvjgwUYcnhepQOvMR1URA"
			>
				<div className={classes.navigationControl}>
					<NavigationControl
						onViewportChange={newViewport => setViewport(newViewport)}
					/>
				</div>
				{/* pin for users current position */}
				{userPosition && (
					<Marker
						latitude={userPosition.latitude}
						longitude={userPosition.longitude}
						offsetLeft={-19}
						offsetTop={-37}
					>
						<PinIcon size={40} color="red" />
					</Marker>
				)}
				{state.draft && (
					<Marker
						latitude={state.draft.latitude}
						longitude={state.draft.longitude}
						offsetLeft={-19}
						offsetTop={-37}
					>
						<PinIcon size={40} color="hotpink" />
					</Marker>
				)}
				{/* created pins */}
				{state.pins.map(pin => (
					<Marker
						key={pin._id}
						latitude={pin.latitude}
						longitude={pin.longitude}
						offsetLeft={-19}
						offsetTop={-37}
					>
						<PinIcon
							onClick={() => handleSelectPin(pin)}
							size={40}
							color={highlightNewPin(pin)}
						/>
					</Marker>
				))}

				{/* popup dialog for created pins */}
				{popup && (
					<Popup
						anchor="top"
						latitude={popup.latitude}
						longitude={popup.longitude}
						closeOnClick={false}
						onClose={() => setPopup(null)}
					>
						<img
							src={popup.image}
							alt={popup.title}
							className={classes.popupImage}
						/>
						<div className={classes.popupTab}>
							<Typography>
								{popup.latitude.toFixed(6)},{popup.longitude.toFixed(6)}
							</Typography>
							{isAuthUser() && (
								<Button>
									{" "}
									Delete
									<DeleteIcon
										onClick={() => handleDeletePin(popup)}
										className={classes.deleteIcon}
									/>
								</Button>
							)}
						</div>
					</Popup>
				)}
			</ReactMapGL>
			{/* subscriptions for updating and deleting pins */}
			<Subscription
				subscription={PIN_ADDED_SUBSCRIPTION}
				onSubscriptionData={({ subscriptionData }) => {
					const { pinAdded } = subscriptionData.data;
					console.log(pinAdded);
					dispatch({ type: "CREATE_PIN", payload: pinAdded });
				}}
			/>
			<Subscription
				subscription={PIN_DELETED_SUBSCRIPTION}
				onSubscriptionData={({ subscriptionData }) => {
					const { pinDeleted } = subscriptionData.data;
					console.log(pinDeleted);
					dispatch({ type: "DELETE_PIN", payload: pinDeleted });
				}}
			/>
			<Subscription
				subscription={PIN_UPDATED_SUBSCRIPTION}
				onSubscriptionData={({ subscriptionData }) => {
					const { pinUpdated } = subscriptionData.data;
					console.log(pinUpdated);
					dispatch({ type: "CREATE_COMMENT", payload: pinUpdated });
				}}
			/>
			{/* Blog area to add pin content */}
			<Blog />
		</div>
	);
};

const styles = {
	root: {
		display: "flex"
	},
	rootMobile: {
		display: "flex",
		flexDirection: "column-reverse"
	},
	navigationControl: {
		position: "absolute",
		top: 0,
		left: 0,
		margin: "1em"
	},
	deleteIcon: {
		color: "red"
	},
	popupImage: {
		padding: "0.4em",
		height: 200,
		width: 200,
		objectFit: "cover"
	},
	popupTab: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		flexDirection: "column"
	}
};

export default withStyles(styles)(Map);
