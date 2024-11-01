import { useEffect, useState } from "react";
import { Box, Flex, Text, Avatar, Button, Spinner, Input } from "@chakra-ui/react";
import { Link, useParams } from "react-router-dom";
import useFollowUnfollow from "../hooks/useFollowUnfollow";
import SuggestedUsers from "../components/SuggestedUsers";
import { conversationsAtom, selectedConversationAtom } from "../atoms/messagesAtom";
import useShowToast from "../hooks/useShowToast";
import { useRecoilState, useRecoilValue } from "recoil";
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
			if (data.error) {
				showToast("Error", data.error, "error");
				setUsers([]);
			} else {
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
	}, [query]);

	

	return (
		<Box p={4} mt={-50}>
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
			
			<Flex direction="column"  mb={5}>
				{users.length === 0 ? (
					<Text>No users found</Text>
				) : (
					users.map((user) => (
						<Flex key={user._id} align="center" p={2} borderBottom="1px" borderColor="gray.200">
							<Link to={`/${user.username}`}>
								<Avatar src={user.profilePic} name={user.username} />
							</Link>
							<Flex align="center" ml={3}>
								<Text fontWeight="bold">{user.username}</Text>
							</Flex>
							<Button ml="auto">Follow</Button>
						</Flex>
					))
				)}
			</Flex>
			<SuggestedUsers />
		</Box>
	);
};

export default UserSearch;
