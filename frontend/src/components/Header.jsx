import { useLocation } from "react-router-dom"; // Import useLocation
import { Button, Flex, Box, Link, useColorMode, Text, Input } from "@chakra-ui/react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import userAtom from "../atoms/userAtom";
import { AiFillHome } from "react-icons/ai";
import { RxAvatar } from "react-icons/rx";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";
import useLogout from "../hooks/useLogout";
import authScreenAtom from "../atoms/authAtom";
import { BsFillChatQuoteFill } from "react-icons/bs";
import { MdOutlineSettings } from "react-icons/md";
import { AddIcon, SearchIcon } from "@chakra-ui/icons";
import { useDisclosure } from "@chakra-ui/react";
import CreatePost from "./CreatePost"; // Import the CreatePost component
import { useState } from "react"; // Import useState for search functionality

const Header = () => {
	const navigate = useNavigate(); // Initialize useNavigate
	const { colorMode, toggleColorMode } = useColorMode();
	const user = useRecoilValue(userAtom);
	const logout = useLogout();
	const setAuthScreen = useSetRecoilState(authScreenAtom);
	const { isOpen, onOpen, onClose } = useDisclosure();
	const [searchTerm, setSearchTerm] = useState("");

	const handleSearchRedirect = () => {
		navigate(`/search`);
	};
	// Check if current path is "/chat" and viewport is small
	const isChatPageOnMobile = location.pathname === "/chat" && window.innerWidth <= 768;

	// Don't render Header in mobile view if on the chat page
	if (isChatPageOnMobile) return null;

	return (
		<>
			<Flex justifyContent="space-between" mt={6} mb={12}>
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
						height="40px" // Adjust height for better alignment
						width="40px"  // Adjust width for consistent button size
						borderRadius="50%" // Make the button circular
						_hover={{ bg: "gray.200" }} // Add hover effect
						aria-label="Add"
					  >
						<AddIcon />
					  </Button>
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

				{/* Mobile Bottom Navigation */}
				{user && (
					<Box
					display={{ base: "flex", md: "none" }} // Show only on mobile devices
					position="fixed"
					bottom={0}
					left={0}
					right={0}
					bg={colorMode === "dark" ? "black" : "white"}
					borderTop="1px solid"
					borderColor="gray.200"
					justifyContent="space-around"
					alignItems="center" // Center the items vertically
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
					  <AddIcon boxSize={6} /> {/* Use boxSize for consistent sizing */}
					</Button>
					<Link as={RouterLink} to="/settings" aria-label="Settings">
					  <MdOutlineSettings size={24} />
					</Link>
					<Link as={RouterLink} to={`/${user.username}`} aria-label="Profile">
					  <RxAvatar size={24} />
					</Link>
				  </Box>
				)}
			</Flex>

			{/* Pass the modal state to CreatePost */}
			<CreatePost isOpen={isOpen} onClose={onClose} />
		</>
	);
};

export default Header;
