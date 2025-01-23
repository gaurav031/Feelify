import { useEffect, useState } from "react";
import {
	Box,
	Flex,
	Text,
	Avatar,
	Button,
	Spinner,
	Input,
	InputGroup,
	InputRightElement,
	Divider,
	useColorModeValue,
} from "@chakra-ui/react";
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

	const bg = useColorModeValue("white", "gray.800");
	const cardBg = useColorModeValue("gray.100", "gray.700");
	const hoverBg = useColorModeValue("gray.200", "gray.600");
	const inputFocusBorder = useColorModeValue("blue.400", "teal.300");
	const textColor = useColorModeValue("gray.800", "white");

	const handleSearch = async () => {
		setLoading(true);
		try {
			const res = await fetch(`/api/users/profile/${searchText}`);
			const data = await res.json();

			if (res.status === 404) {
				setUsers([]); // Clear users array
			} else if (data) {
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
	}, [searchText]);

	return (
		<Box p={6} mt={4} bg={bg} borderRadius="md" shadow="lg" maxW="600px" mx="auto">
			{/* Search Input */}
			<Flex alignItems="center" gap={2} mb={6}>
				<InputGroup>
					<Input
						placeholder="Search for a user"
						value={searchText}
						onChange={(e) => setSearchText(e.target.value)}
						variant="filled"
						_focus={{
							borderColor: inputFocusBorder,
							boxShadow: `0 0 8px ${inputFocusBorder}`,
						}}
						borderRadius="full"
						size="lg"
					/>
					<InputRightElement>
						<Button
							size="sm"
							colorScheme="blue"
							variant="ghost"
							onClick={handleSearch}
							_hover={{ transform: "scale(1.1)", transition: "0.3s" }}
						>
							<SearchIcon />
						</Button>
					</InputRightElement>
				</InputGroup>
			</Flex>

			{/* Users List */}
			<Flex direction="column" mb={5} gap={4}>
				{loading ? (
					<Flex justify="center" align="center">
						<Spinner size="lg" color="blue.400" />
					</Flex>
				) : users.length === 0 ? (
					<Text
						textAlign="center"
						color="gray.500"
						mt={6}
						fontSize="lg"
						fontWeight="bold"
						animation="fadeIn 1s"
					>
						Sorry, User Not Found{" "}
						<span role="img" aria-label="thinking" style={{ animation: "bounce 2s infinite" }}>
							🤔
						</span>{" "}
						<span role="img" aria-label="sad" style={{ animation: "bounce 2s infinite" }}>
							😞
						</span>
					</Text>
				) : (
					users.map((user) => (
						<Flex
							key={user._id}
							p={4}
							bg={cardBg}
							borderRadius="md"
							align="center"
							boxShadow="md"
							_hover={{ bg: hoverBg, transform: "scale(1.02)", transition: "0.3s" }}
							cursor="pointer"
							transition="all 0.3s"
						>
							<Link to={`/${user.username}`}>
								<Avatar src={user.profilePic} name={user.username} size="lg" />
							</Link>
							<Flex direction="column" ml={4}>
								<Text fontWeight="bold" fontSize="lg" color={textColor}>
									{user.username}
								</Text>
								<Text fontSize="sm" color="gray.500">
									{user.bio || "This user hasn't added a bio yet."}
								</Text>
							</Flex>
						</Flex>
					))
				)}
			</Flex>

			{/* Divider and Suggested Users */}
			<Divider mb={4} />
			<SuggestedUsers />
		</Box>
	);
};

export default UserSearch;
