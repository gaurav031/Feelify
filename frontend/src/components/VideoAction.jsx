import {
	Box,
	Button,
	Flex,
	FormControl,
	Input,
	Modal,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalOverlay,
	Text,
	useDisclosure,
} from "@chakra-ui/react";
import { useState } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import useShowToast from "../hooks/useShowToast";
import postsAtom from "../atoms/postsAtom";
import { Link } from "react-router-dom";

const VideoAction = ({ post }) => {
	const user = useRecoilValue(userAtom);
	const [liked, setLiked] = useState(post.likes.includes(user?._id));
	const [posts, setPosts] = useRecoilState(postsAtom);
	const [isLiking, setIsLiking] = useState(false);
	const [isReplying, setIsReplying] = useState(false);
	const [reply, setReply] = useState("");

	const showToast = useShowToast();
	const { isOpen, onOpen, onClose } = useDisclosure();

	const handleLikeAndUnlike = async () => {
		if (!user) return showToast("Error", "You must be logged in to like a post", "error");
		if (isLiking) return;
		setIsLiking(true);
		try {
			const res = await fetch("/api/posts/like/" + post._id, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
			});
			const data = await res.json();
			if (data.error) return showToast("Error", data.error, "error");

			if (!liked) {
				// add the id of the current user to post.likes array
				const updatedPosts = posts.map((p) => {
					if (p._id === post._id) {
						return { ...p, likes: [...p.likes, user._id] };
					}
					return p;
				});
				setPosts(updatedPosts);
			} else {
				// remove the id of the current user from post.likes array
				const updatedPosts = posts.map((p) => {
					if (p._id === post._id) {
						return { ...p, likes: p.likes.filter((id) => id !== user._id) };
					}
					return p;
				});
				setPosts(updatedPosts);
			}

			setLiked(!liked);
		} catch (error) {
			showToast("Error", error.message, "error");
		} finally {
			setIsLiking(false);
		}
	};

	const handleReply = async () => {
		if (!user) return showToast("Error", "You must be logged in to reply to a post", "error");
		if (isReplying) return;
		setIsReplying(true);
		try {
			const res = await fetch("/api/posts/reply/" + post._id, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ text: reply }),
			});
			const data = await res.json();
			if (data.error) return showToast("Error", data.error, "error");

			const updatedPosts = posts.map((p) => {
				if (p._id === post._id) {
					return { ...p, replies: [...p.replies, data] };
				}
				return p;
			});
			setPosts(updatedPosts);
			showToast("Success", "Reply posted successfully", "success");
			onClose();
			setReply("");
		} catch (error) {
			showToast("Error", error.message, "error");
		} finally {
			setIsReplying(false);
		}
	};

	return (
		<Flex flexDirection='column' alignItems='center'> {/* Changed flexDirection to 'column' */}
			<Flex gap={{ base: 35, md: 50 }} my={2} flexDirection='column' alignItems='center' onClick={(e) => e.preventDefault()}> {/* Added flexDirection and alignItems */}
				<svg
					aria-label='Like'
					color={liked ? "rgb(237, 73, 86)" : ""}
					fill={liked ? "rgb(237, 73, 86)" : "transparent"}
					height='30'
					role='img'
					viewBox='0 0 24 22'
					width='30'

					onClick={handleLikeAndUnlike}
				>
					<path
						d='M1 7.66c0 4.575 3.899 9.086 9.987 12.934.338.203.74.406 1.013.406.283 0 .686-.203 1.013-.406C19.1 16.746 23 12.234 23 7.66 23 3.736 20.245 1 16.672 1 14.603 1 12.98 1.94 12 3.352 11.042 1.952 9.408 1 7.328 1 3.766 1 1 3.736 1 7.66Z'
						stroke='currentColor'
						strokeWidth='2'
					></path>
				</svg>
				<Text color={"white"} fontSize='sm' mt={[-5, -10]} >
					{post.likes.length} likes
				</Text>
				<svg
					aria-label='Comment'
					color=''
					fill=''
					height='30'
					role='img'
					viewBox='0 0 24 24'
					width='30'
					onClick={onOpen}
				>

					<path
						d='M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z'
						fill='none'
						stroke='currentColor'
						strokeLinejoin='round'
						strokeWidth='2'
					></path>
				</svg>
				<Link to={`/${post.postedBy.username}/post/${post._id}`}>
					<Text color={"white"} fontSize='sm' mt={[-5, -10]} >
						{post.replies.length} replies
					</Text>
				</Link>
			</Flex>



			<Modal isOpen={isOpen} onClose={onClose}>
				<ModalOverlay />
				<ModalContent>
					<ModalHeader></ModalHeader>
					<ModalCloseButton />
					<ModalBody pb={6}>
						<FormControl>
							<Input
								placeholder='Reply goes here..'
								value={reply}
								onChange={(e) => setReply(e.target.value)}
							/>
						</FormControl>
					</ModalBody>

					<ModalFooter>
						<Button colorScheme='blue' size={"sm"} mr={3} isLoading={isReplying} onClick={handleReply}>
							Reply			
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</Flex >
	);
};

export default VideoAction;

const RepostSVG = () => {
	return (
		<svg
			aria-label='Repost'
			color='currentColor'
			fill='currentColor'
			height='20'
			role='img'
			viewBox='0 0 24 24'
			width='20'
		>

			<path
				fill=''
				d='M19.998 9.497a1 1 0 0 0-1 1v4.228a3.274 3.274 0 0 1-3.27 3.27h-5.313l1.791-1.787a1 1 0 0 0-1.412-1.416L7.29 18.287a1.004 1.004 0 0 0-.294.707v.001c0 .023.012.042.013.065a.923.923 0 0 0 .281.643l3.502 3.504a1 1 0 0 0 1.414-1.414l-1.797-1.798h5.318a5.276 5.276 0 0 0 5.27-5.27v-4.228a1 1 0 0 0-1-1Zm-6.41-3.496-1.795 1.795a1 1 0 1 0 1.414 1.414l3.5-3.5a1.003 1.003 0 0 0 0-1.417l-3.5-3.5a1 1 0 0 0-1.414 1.414l1.794 1.794H8.624a5.272 5.272 0 0 0-5.27 5.27v4.228a1 1 0 0 0 1 1h11.998a1 1 0 0 0 1-1v-4.228a5.276 5.276 0 0 0-5.27-5.27Z'
			></path>
		</svg>
	);
};

const ShareSVG = () => {
	return (
		<svg
			aria-label='Share Post'
			color='currentColor'
			fill='currentColor'
			height='20'
			role='img'
			viewBox='0 0 24 24'
			width='20'
		>

			<path
				fill=''
				d='M18 2c2.209 0 4 1.791 4 4s-1.791 4-4 4c-1.633 0-3.054-.928-3.734-2.275l-4.58 2.29a2.2 2.2 0 0 0-.217-.14l-.342-.171a3.712 3.712 0 0 0-.635-.332 4.14 4.14 0 0 0-.568-.245l-4.573-2.287A4.003 4.003 0 0 0 6 6c-2.209 0-4 1.791-4 4s1.791 4 4 4c.168 0 .334-.016.5-.026l5.042 2.494a2.013 2.013 0 0 0 2.507-1.077 2.013 2.013 0 0 0-1.073-2.507l-2.573-1.268A2.045 2.045 0 0 0 11 13a2.002 2.002 0 0 0 2 2 2.046 2.046 0 0 0 1.111-.355l5.599-2.797a3.98 3.98 0 0 0 1.073-3.034 4.003 4.003 0 0 0-2.211-3.111A3.992 3.992 0 0 0 18 2Zm0 5c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3Zm-9.85 7.489a2.001 2.001 0 0 0 1.664 2.164l5.065 2.515-2.951 2.951a3.775 3.775 0 0 0-.44-.335l-3.062-1.531a2.014 2.014 0 0 0-2.267 2.3l.531 5.577A3.957 3.957 0 0 0 10.5 22a4 4 0 0 0 2.468-6.928 2.048 2.048 0 0 0 1.491-.679l2.453-2.453-2.963-2.468a1.975 1.975 0 0 0-.49-.396Z'
			></path>
		</svg>
	);
};
