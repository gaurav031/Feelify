import { useState } from "react";
import { Avatar } from "@chakra-ui/avatar";
import { Box, Flex, Link, Text, VStack } from "@chakra-ui/layout";
import { Menu, MenuButton, MenuItem, MenuList } from "@chakra-ui/menu";
import { Portal, Modal, ModalOverlay, ModalContent, ModalBody } from "@chakra-ui/react";
import { Button, Image, useToast } from "@chakra-ui/react";
import { BsInstagram } from "react-icons/bs";
import { CgMoreO } from "react-icons/cg";
import { useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import { Link as RouterLink } from "react-router-dom";
import useFollowUnfollow from "../hooks/useFollowUnfollow";
import logo from "../assets/images";

const UserHeader = ({ user }) => {
	const toast = useToast();
	const currentUser = useRecoilValue(userAtom); // logged-in user
	const { handleFollowUnfollow, following, updating } = useFollowUnfollow(user);

	const [isProfilePicOpen, setIsProfilePicOpen] = useState(false); // state to control modal

	const copyURL = () => {
		const currentURL = window.location.href;
		navigator.clipboard.writeText(currentURL).then(() => {
			toast({
				title: "Success",
				status: "success",
				description: "Profile link copied.",
				duration: 3000,
				isClosable: true,
			});
		});
	};

	return (
		<VStack gap={4} alignItems="start">
			<Flex justifyContent="space-between" w="full">
				<Box>
					<Text fontSize="2xl" fontWeight="bold">
						{user.name}
					</Text>
					<Flex gap={2} alignItems="center">
						<Text fontSize="sm">@{user.username}</Text>
						<Text fontSize="xs" bg="gray.700" color="gray.300" p={1} borderRadius="full">
							Feelify.net
						</Text>
					</Flex>
				</Box>
				<Box>
					{/* Avatar with click event to open modal */}
					<Avatar
						name={user.name}
						src={user.profilePic || 'https://bit.ly/broken-link'}
						size={{
							base: "md",
							md: "xl",
						}}
						cursor="pointer"
						onClick={() => setIsProfilePicOpen(true)}
					/>
				</Box>
			</Flex>

			<Text>{user.bio}</Text>

			{currentUser?._id === user._id ? (
				<Link as={RouterLink} to="/update">
					<Button size="sm">Update Profile</Button>
				</Link>
			) : (
				<Button size="sm" onClick={handleFollowUnfollow} isLoading={updating}>
					{following ? "Unfollow" : "Follow"}
				</Button>
			)}

			<Flex w="full" justifyContent="space-between">
				<Flex gap={2} alignItems="center">
					<Link as={RouterLink} to={`/${user.username}/followerlist`}>
						<Text color="gray.500">{user.followers.length} followers</Text>
					</Link>
					<Box w="1" h="1" bg="gray.500" borderRadius="full" mx={2}></Box>
					<Link as={RouterLink} to="/feelify">
						<Text color="gray.500">feelify.fun</Text>
					</Link>
				</Flex>
				<Flex>
					<Box className="icon-container">
						<Image
							src={logo}
							height={{ base: 6, md: 6 }}
							width={{ base: 6, md: 6 }}
						/>
					</Box>
					<Box className="icon-container">
						<Menu>
							<MenuButton>
								<CgMoreO size={24} cursor="pointer" />
							</MenuButton>
							<Portal>
								<MenuList bg="gray.700">
									<MenuItem bg="gray.700" onClick={copyURL}>
										Copy link
									</MenuItem>
								</MenuList>
							</Portal>
						</Menu>
					</Box>
				</Flex>
			</Flex>

			<Flex w="full" borderBottom="1.5px solid white">
				<Flex flex={1} justifyContent="center" pb={3} cursor="pointer" borderBottom="2px solid white">
					<Text fontWeight="bold">Threads</Text>
				</Flex>
				<Flex flex={1} justifyContent="center" color="gray.500" pb={3} cursor="pointer">
					<Text fontWeight="bold">Replies</Text>
				</Flex>
			</Flex>

			{/* Modal for zoomed-in profile picture */}
			<Modal isOpen={isProfilePicOpen} onClose={() => setIsProfilePicOpen(false)} isCentered>
				<ModalOverlay />
				<ModalContent maxW="sm" bg="transparent" boxShadow="none">
					<ModalBody p={0} display="flex" justifyContent="center">
						<Image
							src={user.profilePic || 'https://bit.ly/broken-link'}
							borderRadius="full" // Circular shape
							width="250px"       // Fixed width for circular display
							height="250px"      // Fixed height for circular display
						/>
					</ModalBody>
				</ModalContent>
			</Modal>

		</VStack>
	);
};

export default UserHeader;
