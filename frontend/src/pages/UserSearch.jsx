import { useEffect, useState } from "react";
import { Box, Flex, Text, Avatar, Button, Spinner, Input } from "@chakra-ui/react";
import { Link, useParams } from "react-router-dom";
import useShowToast from "../hooks/useShowToast";
import SuggestedUsers from "../components/SuggestedUsers";
import { useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import { SearchIcon } from "@chakra-ui/icons";

const UserSearch = () => {
	const { query } = useParams();
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchText, setSearchText] = useState(query || "");
	const showToast = useShowToast();
	const currentUser = useRecoilValue(userAtom);

	const handleSearch = async () => {
		setLoading(true);
		try {
			const res = await fetch(`/api/users/profile/${searchText}`);
			const data = await res.json();

			// Check if the response contains a user
			if (res.status === 404) {
				// User not found, show a toast and clear users
				setUsers([]);  // Clear users array
			} else if (data) {
				// User found, set the user in state
				setUsers([data]);
			}
		} catch (error) {
			showToast("Error", error.message, "error");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (searchText) handleSearch();
	}, [searchText]);  // Depend on searchText instead of query

	return (
		<Box p={4} mt={2}>
			<Flex alignItems="center" gap={2}>
				<Input
					placeholder="Search for a user"
					value={searchText}
					onChange={(e) => setSearchText(e.target.value)}
				/>
				<Button size={"sm"} onClick={handleSearch}>
					<SearchIcon />
				</Button>
			</Flex>

			<Flex direction="column" mb={5}>
				{loading ? (
					<Spinner />
				) : users.length === 0 ? (
					<Text textAlign="center" color="gray.500" mt={4}>
						जैसे आप खोजने की कोशिश कर रहे हैं, वो यहाँ खाता नहीं बनाया है{" "}
						<span role="img" aria-label="thinking">🤔</span>{" "}
						<span role="img" aria-label="sad">😞</span>
					</Text>
				) : (
					users.map((user) => (
						<Flex key={user._id} align="center" p={2} borderBottom="1px" borderColor="gray.200">
							<Link to={`/${user.username}`}>
								<Avatar src={user.profilePic} name={user.username} />
							</Link>
							<Flex align="center" ml={3}>
								<Text fontWeight="bold">{user.username}</Text>
							</Flex>
							
						</Flex>
					))
				)}
			</Flex>
			<SuggestedUsers />
		</Box>
	);
};

export default UserSearch;
