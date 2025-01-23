import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Button,
  Flex,
  Box,
  Link,
  useColorMode,
  Text,
  useToast,
  Avatar,
  keyframes,
} from "@chakra-ui/react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import userAtom from "../atoms/userAtom";
import authScreenAtom from "../atoms/authAtom";
import { AiFillHome } from "react-icons/ai";
import { FiLogOut } from "react-icons/fi";
import { BsFillChatQuoteFill } from "react-icons/bs";
import { MdOutlineSettings, MdVideoLibrary } from "react-icons/md";
import { AddIcon, SearchIcon } from "@chakra-ui/icons";
import { useDisclosure } from "@chakra-ui/react";
import axios from "axios";
import CreatePost from "./CreatePost";
import { FaRegHeart } from "react-icons/fa6";
import { useDispatch, useSelector } from "react-redux";
import { setNotifications } from "../redux/notificationsSlice";

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
`;

const Header = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const { colorMode, toggleColorMode } = useColorMode();
	const user = useRecoilValue(userAtom);
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
		  const response = await axios.get("/api/notifications");
		  dispatch(setNotifications(response.data));
		} catch (error) {
		  console.error("Error fetching notifications:", error);
		}
	  };
  
	  fetchUnreadNotifications();
	}, [dispatch]);
  
	const handleSearchRedirect = () => {
	  navigate(`/search`);
	};
  
	const isChatPageOnMobile =
	  location.pathname === "/chat" && window.innerWidth <= 768;
	const isStoryOnMobile =
	  location.pathname === "/story-viewer" && window.innerWidth <= 768;
	const isVideoPageOnMobile =
	  location.pathname === "/video" && window.innerWidth <= 768;
  
	// Hide upper header for specific pages on mobile view
	if (isChatPageOnMobile || isStoryOnMobile) return null;
  
	return (
	  <>
		{/* Conditionally render upper header */}
		{!isVideoPageOnMobile && (
		  <Flex justifyContent="space-between" alignItems="center" mt={2}>
			<Link
			  as={RouterLink}
			  to="/"
			  display={{ base: "none", md: "flex" }}
			  color={colorMode === "dark" ? "yellow.300" : "purple.500"}
			  _hover={{ color: "purple.700", transform: "scale(1.2)" }}
			  transition="0.3s ease"
			>
			  <AiFillHome size={28} />
			</Link>
			<Text
			  as="h1"
			  cursor="pointer"
			  fontSize="2xl"
			  fontWeight="bold"
			  onClick={toggleColorMode}
			  animation={`${pulse} 2s infinite`}
			  bgGradient={
				colorMode === "dark"
				  ? "linear(to-l, pink.300, purple.400)"
				  : "linear(to-r, green.800, red.500)"
			  }
			  bgClip="text"
			>
			  Feelify
			</Text>
  
			{user ? (
			  <Flex alignItems="center" gap={4}>
				<Button
				  onClick={handleSearchRedirect}
				  aria-label="Search"
				  color={colorMode === "dark" ? "cyan.300" : "teal.600"}
				  _hover={{ bg: "cyan.100", transform: "scale(1.2)" }}
				  transition="0.3s ease"
				>
				  <SearchIcon />
				</Button>
				<Button
				  onClick={onOpen}
				  display={{ base: "none", md: "flex" }}
				  height="40px"
				  width="40px"
				  borderRadius="50%"
				  bg={colorMode === "dark" ? "pink.500" : "blue.300"}
				  _hover={{
					bg: colorMode === "dark" ? "pink.300" : "blue.500",
					transform: "scale(1.2)",
				  }}
				  aria-label="Add"
				>
				  <AddIcon />
				</Button>
				<Link
				  as={RouterLink}
				  display={{ base: "none", md: "flex" }}
				  to={`/video`}
				  color={colorMode === "dark" ? "yellow.300" : "orange.500"}
				  _hover={{ color: "yellow.500", transform: "scale(1.2)" }}
				  transition="0.3s ease"
				>
				  <MdVideoLibrary size={28} />
				</Link>
				{/* Notifications Icon with Unread Badge */}
				<Link
				  as={RouterLink}
				  to="/notifications"
				  position="relative"
				  color={colorMode === "dark" ? "red.300" : "red.500"}
				  _hover={{ transform: "scale(1.2)" }}
				  transition="0.3s ease"
				>
				  <FaRegHeart size={28} />
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
				<Link
				  as={RouterLink}
				  display={{ base: "none", md: "flex" }}
				  to={`/chat`}
				  color={colorMode === "dark" ? "green.300" : "green.500"}
				  _hover={{ color: "green.600", transform: "scale(1.2)" }}
				  transition="0.3s ease"
				>
				  <BsFillChatQuoteFill size={28} />
				</Link>
				<Link
				  as={RouterLink}
				  to={`/settings`}
				  color={colorMode === "dark" ? "blue.300" : "purple.600"}
				  _hover={{ color: "blue.500", transform: "scale(1.2)" }}
				  transition="0.3s ease"
				>
				  <MdOutlineSettings size={28} />
				</Link>
				<Link
				  as={RouterLink}
				  display={{ base: "none", md: "flex" }}
				  to={`/${user.username}`}
				>
				  <Avatar
					size="sm"
					src={user?.profilePic}
					border={`2px solid ${
					  colorMode === "dark" ? "purple.300" : "teal.500"
					}`}
				  />
				</Link>
			  </Flex>
			) : (
			  <Flex gap={4}>
				<Link
				  as={RouterLink}
				  to="/auth"
				  onClick={() => setAuthScreen("login")}
				>
				  Login
				</Link>
				<Link
				  as={RouterLink}
				  to="/auth"
				  onClick={() => setAuthScreen("signup")}
				>
				  Sign up
				</Link>
			  </Flex>
			)}
		  </Flex>
		)}
  
		{/* Mobile Bottom Navigation */}
		{user && (
		  <Box
			display={{ base: "flex", md: "none" }}
			position="fixed"
			bottom={0}
			left={0}
			right={0}
			bg={colorMode === "dark" ? "gray.800" : "gray.100"}
			borderTop="1px solid"
			borderColor="gray.200"
			justifyContent="space-around"
			alignItems="center"
			p={2}
			zIndex={1000}
		  >
			<Link as={RouterLink} to="/" aria-label="Home">
			  <AiFillHome size={28} color="orange" />
			</Link>
			<Link as={RouterLink} to="/chat" aria-label="Chat">
			  <BsFillChatQuoteFill size={28} color="limegreen" />
			</Link>
			<Button
			  onClick={onOpen}
			  aria-label="Add"
			  bg="purple.400"
			  _hover={{ bg: "purple.600", transform: "scale(1.2)" }}
			>
			  <AddIcon boxSize={6} />
			</Button>
			<Link as={RouterLink} to="/video" aria-label="video">
			  <MdVideoLibrary size={28} color="skyblue" />
			</Link>
			<Link as={RouterLink} to={`/${user.username}`} aria-label="Profile">
			  <Avatar size="sm" src={user?.profilePic} />
			</Link>
		  </Box>
		)}
  
		{/* Pass the modal state to CreatePost */}
		<CreatePost isOpen={isOpen} onClose={onClose} />
	  </>
	);
  };
  
  export default Header;
  