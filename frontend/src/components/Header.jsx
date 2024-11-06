import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link as RouterLink } from "react-router-dom";
import { Button, Flex, Box, Link, useColorMode, Text, useToast } from "@chakra-ui/react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import userAtom from "../atoms/userAtom";
import authScreenAtom from "../atoms/authAtom";
import { AiFillHome } from "react-icons/ai";
import { RxAvatar } from "react-icons/rx";
import { FiLogOut } from "react-icons/fi";
import { BsFillChatQuoteFill } from "react-icons/bs";
import { MdOutlineSettings } from "react-icons/md";
import { AddIcon, SearchIcon } from "@chakra-ui/icons";
import { useDisclosure } from "@chakra-ui/react";
import axios from "axios";
import useLogout from "../hooks/useLogout";
import CreatePost from "./CreatePost";
import { FaRegHeart } from "react-icons/fa6";
import { useDispatch, useSelector } from 'react-redux';
import { setNotifications } from '../redux/notificationsSlice';

const Header = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const { colorMode, toggleColorMode } = useColorMode();
	const user = useRecoilValue(userAtom);
	const logout = useLogout();
	const setAuthScreen = useSetRecoilState(authScreenAtom);
	const { isOpen, onOpen, onClose } = useDisclosure();
	const [searchTerm, setSearchTerm] = useState("");
	
	const dispatch = useDispatch();
	const { unreadCount } = useSelector((state) => state.notifications);
	
	
	const toast = useToast();

	// Fetch notifications to get the count of unread notifications
	useEffect(() => {
		const fetchUnreadNotifications = async () => {
			try {
				const response = await axios.get('/api/notifications');
				dispatch(setNotifications(response.data));
			} catch (error) {
				console.error('Error fetching notifications:', error);
			}
		};

		fetchUnreadNotifications();
	}, [dispatch]);

	const handleSearchRedirect = () => {
		navigate(`/search`);
	};

	const isChatPageOnMobile = location.pathname === "/chat" && window.innerWidth <= 768;

	if (isChatPageOnMobile) return null;

	return (
		<>
			<Flex justifyContent="space-between" mt={2} mb={3}>
				<Link as={RouterLink} to="/" display={{ base: "none", md: "flex" }}>
					<AiFillHome size={24} />
				</Link>
				<Text
					as="h1"
					cursor="pointer"
					fontSize="xl"
					fontWeight="bold"
					onClick={toggleColorMode}
					color={colorMode === "dark" ? "white" : "black"}
				>
					Feelify
				</Text>

				{user ? (
					<Flex alignItems="center" gap={4}>
						<Button onClick={handleSearchRedirect} aria-label="Search">
							<SearchIcon />
						</Button>
						<Button
							onClick={onOpen}
							display={{ base: "none", md: "flex" }}
							height="40px"
							width="40px"
							borderRadius="50%"
							_hover={{ bg: "gray.200" }}
							aria-label="Add"
						>
							<AddIcon />
						</Button>

						{/* Notifications Icon with Unread Badge */}
						<Link as={RouterLink} to="/notifications" position="relative">
							<FaRegHeart size={24} color={colorMode === 'dark' ? 'white' : 'black'} />
							{unreadCount > 0 && (
								<Text
									position="absolute"
									top="-2px"
									right="-2px"
									fontSize="0.7em"
									fontWeight="bold"
									color="white"
									bg="red"
									borderRadius="full"
									width="16px"
									height="16px"
									display="flex"
									alignItems="center"
									justifyContent="center"
								>
									{unreadCount}
								</Text>
							)}
						</Link>
						<Link as={RouterLink} display={{ base: "none", md: "flex" }} to={`/${user.username}`}>
							<RxAvatar size={24} />
						</Link>
						<Link as={RouterLink} display={{ base: "none", md: "flex" }} to={`/chat`}>
							<BsFillChatQuoteFill size={20} />
						</Link>
						<Link as={RouterLink} display={{ base: "none", md: "flex" }} to={`/settings`}>
							<MdOutlineSettings size={20} />
						</Link>
						<Button size="xs" onClick={logout} aria-label="Logout">
							<FiLogOut size={20} />
						</Button>
					</Flex>
				) : (
					<Flex gap={4}>
						<Link as={RouterLink} to="/auth" onClick={() => setAuthScreen("login")}>
							Login
						</Link>
						<Link as={RouterLink} to="/auth" onClick={() => setAuthScreen("signup")}>
							Sign up
						</Link>
					</Flex>
				)}
			</Flex>

			{/* Mobile Bottom Navigation */}
			{user && (
				<Box
					display={{ base: "flex", md: "none" }}
					position="fixed"
					bottom={0}
					left={0}
					right={0}
					bg={colorMode === "dark" ? "black" : "white"}
					borderTop="1px solid"
					borderColor="gray.200"
					justifyContent="space-around"
					alignItems="center"
					p={2}
					zIndex={1000}
				>
					<Link as={RouterLink} to="/" aria-label="Home">
						<AiFillHome size={24} />
					</Link>
					<Link as={RouterLink} to="/chat" aria-label="Chat">
						<BsFillChatQuoteFill size={24} />
					</Link>
					<Button onClick={onOpen} aria-label="Add">
						<AddIcon boxSize={6} />
					</Button>
					<Link as={RouterLink} to="/settings" aria-label="Settings">
						<MdOutlineSettings size={24} />
					</Link>
					<Link as={RouterLink} to={`/${user.username}`} aria-label="Profile">
						<RxAvatar size={24} />
					</Link>
				</Box>
			)}

			{/* Pass the modal state to CreatePost */}
			<CreatePost isOpen={isOpen} onClose={onClose} />
		</>
	);
};

export default Header;
