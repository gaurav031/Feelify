import { Avatar, Box, Button, Divider, Flex, Image, Spinner, Text, useColorModeValue, IconButton, Card, CardBody, CardHeader, CardFooter } from "@chakra-ui/react";
import Actions from "../components/Actions";
import { useEffect, useState } from "react";
import Comment from "../components/Comment";
import useGetUserProfile from "../hooks/useGetUserProfile";
import useShowToast from "../hooks/useShowToast";
import { useNavigate, useParams } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useRecoilState, useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import { DeleteIcon, ArrowBackIcon, EditIcon } from "@chakra-ui/icons";
import postsAtom from "../atoms/postsAtom";
import { motion, AnimatePresence } from "framer-motion";

const PostPage = () => {
	const { user, loading: userLoading } = useGetUserProfile();
	const [posts, setPosts] = useRecoilState(postsAtom);
	const showToast = useShowToast();
	const { pid } = useParams();
	const currentUser = useRecoilValue(userAtom);
	const navigate = useNavigate();
	const [isDeleting, setIsDeleting] = useState(false);

	const currentPost = posts.length > 0 ? posts[0] : null;

	const bgColor = useColorModeValue("white", "gray.800");
	const cardBg = useColorModeValue("white", "gray.700");
	const borderColor = useColorModeValue("gray.200", "gray.600");
	const textColor = useColorModeValue("gray.800", "white");
	const subtleTextColor = useColorModeValue("gray.600", "gray.400");

	useEffect(() => {
		const getPost = async () => {
			setPosts([]);
			try {
				const res = await fetch(`/api/posts/${pid}`);
				const data = await res.json();
				if (data.error) {
					showToast("Error", data.error, "error");
					return;
				}
				setPosts([data]);
			} catch (error) {
				showToast("Error", error.message, "error");
			}
		};
		getPost();
	}, [showToast, pid, setPosts]);

	const handleDeletePost = async () => {
		try {
			if (!window.confirm("Are you sure you want to delete this post?")) return;
			
			setIsDeleting(true);
			const res = await fetch(`/api/posts/${currentPost._id}`, {
				method: "DELETE",
			});
			const data = await res.json();
			if (data.error) {
				showToast("Error", data.error, "error");
				return;
			}
			showToast("Success", "Post deleted", "success");
			setPosts([]);
			navigate(`/${user.username}`);
		} catch (error) {
			showToast("Error", error.message, "error");
		} finally {
			setIsDeleting(false);
		}
	};

	const handleBack = () => {
		navigate(-1);
	};

	if (userLoading) {
		return (
			<Flex justifyContent={"center"} alignItems={"center"} minH={"60vh"}>
				<Spinner size={"xl"} color="blue.500" thickness="4px" />
			</Flex>
		);
	}

	if (!currentPost) {
		return (
			<Flex justifyContent={"center"} alignItems={"center"} minH={"60vh"} flexDirection={"column"} gap={4}>
				<Text fontSize={"xl"} color={subtleTextColor}>Post not found</Text>
				<Button leftIcon={<ArrowBackIcon />} onClick={handleBack} colorScheme="blue">
					Go Back
				</Button>
			</Flex>
		);
	}

	return (
		<Box maxW={"800px"} mx={"auto"} p={4} bg={bgColor} minH="100vh">
			{/* Back Button */}
			<Flex mb={6} alignItems="center">
				<IconButton
					icon={<ArrowBackIcon />}
					aria-label="Go back"
					onClick={handleBack}
					variant="ghost"
					colorScheme="blue"
					size="lg"
					mr={4}
					_hover={{ transform: "scale(1.1)" }}
					transition="all 0.2s"
				/>
				<Text fontSize="2xl" fontWeight="bold" color={textColor}>
					Post
				</Text>
			</Flex>

			<AnimatePresence>
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -20 }}
					transition={{ duration: 0.3 }}
				>
					<Card 
						bg={cardBg} 
						borderRadius="xl" 
						boxShadow="xl" 
						border="1px solid" 
						borderColor={borderColor}
						overflow="hidden"
					>
						<CardHeader pb={0}>
							<Flex justifyContent="space-between" alignItems="flex-start">
								<Flex alignItems="center" gap={3} flex="1">
									<Avatar 
										src={user.profilePic} 
										size="lg" 
										name={user.username}
										cursor="pointer"
										onClick={() => navigate(`/${user.username}`)}
										_hover={{ transform: "scale(1.05)" }}
										transition="transform 0.2s"
										border="3px solid"
										borderColor="blue.400"
									/>
									<Box>
										<Flex alignItems="center" gap={2} mb={1}>
											<Text fontSize="lg" fontWeight="bold" color={textColor}>
												{user.username}
											</Text>
											<Image src='/verified.png' w='5' h={5} />
										</Flex>
										<Text fontSize="sm" color={subtleTextColor}>
											{formatDistanceToNow(new Date(currentPost.createdAt))} ago
										</Text>
									</Box>
								</Flex>
								
								{currentUser?._id === user._id && (
									<Flex gap={2}>
										<IconButton
											icon={<EditIcon />}
											aria-label="Edit post"
											size="sm"
											colorScheme="blue"
											variant="ghost"
										/>
										<IconButton
											icon={isDeleting ? <Spinner size="sm" /> : <DeleteIcon />}
											aria-label="Delete post"
											size="sm"
											colorScheme="red"
											variant="ghost"
											onClick={handleDeletePost}
											isLoading={isDeleting}
										/>
									</Flex>
								)}
							</Flex>
						</CardHeader>

						<CardBody py={4}>
							<Text fontSize="lg" color={textColor} lineHeight="1.6" mb={4}>
								{currentPost.text}
							</Text>

							{/* Media Section */}
							{(currentPost.img || currentPost.video) && (
								<Box 
									borderRadius="lg" 
									overflow="hidden" 
									border="1px solid" 
									borderColor={borderColor}
									mb={4}
								>
									{currentPost.img && (
										<Image 
											src={currentPost.img} 
											w="full" 
											objectFit="cover"
											loading="lazy"
											alt="Post image"
										/>
									)}
									{currentPost.video && (
										<video 
											src={currentPost.video} 
											width="100%"
											controls
											style={{ display: 'block' }}
										/>
									)}
								</Box>
							)}
						</CardBody>

						<CardFooter pt={0} flexDirection="column">
							<Flex gap={3} mb={4}>
								<Actions post={currentPost} />
							</Flex>

							{/* Stats */}
							<Flex gap={6} mb={4} color={subtleTextColor} fontSize="sm">
								<Text fontWeight="medium">{currentPost.likes?.length || 0} likes</Text>
								<Text fontWeight="medium">{currentPost.replies?.length || 0} comments</Text>
							</Flex>

							<Divider mb={4} />

							{/* Comments Section */}
							<Box>
								<Text fontSize="lg" fontWeight="bold" mb={4} color={textColor}>
									Comments ({currentPost.replies?.length || 0})
								</Text>
								
								{currentPost.replies && currentPost.replies.length > 0 ? (
									currentPost.replies.map((reply, index) => (
										<Comment
											key={reply._id}
											reply={reply}
											lastReply={index === currentPost.replies.length - 1}
										/>
									))
								) : (
									<Text textAlign="center" color={subtleTextColor} py={8}>
										No comments yet. Be the first to comment!
									</Text>
								)}
							</Box>
						</CardFooter>
					</Card>
				</motion.div>
			</AnimatePresence>
		</Box>
	);
};

export default PostPage;