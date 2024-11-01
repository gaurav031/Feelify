import {
	Button,
	CloseButton,
	Flex,
	FormControl,
	Image,
	Input,
	Modal,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalOverlay,
	Text,
	Textarea,
	useColorModeValue,
} from "@chakra-ui/react";
import { useRef, useState } from "react";
import usePreviewImg from "../hooks/usePreviewImg";
import { BsFillImageFill } from "react-icons/bs";
import { useRecoilState, useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import useShowToast from "../hooks/useShowToast";
import postsAtom from "../atoms/postsAtom";
import { useParams } from "react-router-dom";

const MAX_CHAR = 500;

const CreatePost = ({ isOpen, onClose }) => {
	const [postText, setPostText] = useState("");
	const { handleImageChange, imgUrl, setImgUrl } = usePreviewImg();
	const imageRef = useRef(null);
	const [remainingChar, setRemainingChar] = useState(MAX_CHAR);
	const user = useRecoilValue(userAtom);
	const showToast = useShowToast();
	const [loading, setLoading] = useState(false);
	const [posts, setPosts] = useRecoilState(postsAtom);
	const { username } = useParams();

	const handleTextChange = (e) => {
		const inputText = e.target.value;
		if (inputText.length > MAX_CHAR) {
			const truncatedText = inputText.slice(0, MAX_CHAR);
			setPostText(truncatedText);
			setRemainingChar(0);
		} else {
			setPostText(inputText);
			setRemainingChar(MAX_CHAR - inputText.length);
		}
	};

	const handleCreatePost = async () => {
		setLoading(true);
		try {
			const res = await fetch("/api/posts/create", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ postedBy: user._id, text: postText, img: imgUrl }),
			});
			const data = await res.json();
			if (data.error) {
				showToast("Error", data.error, "error");
				return;
			}
			showToast("Success", "Post created successfully", "success");
			if (username === user.username) {
				setPosts([data, ...posts]);
			}
			onClose();
			setPostText("");
			setImgUrl("");
		} catch (error) {
			showToast("Error", error, "error");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose}>
			<ModalOverlay />
			<ModalContent mx={4} my={6} maxW="lg" borderRadius="md" boxShadow="lg">
				<ModalHeader textAlign="center">Create Post</ModalHeader>
				<ModalCloseButton />
				<ModalBody pb={6} display="flex" flexDirection="column" alignItems="center">
					<FormControl w="100%">
						<Textarea
							placeholder="Post content goes here..."
							onChange={handleTextChange}
							value={postText}
							resize="none"
							minHeight="120px"
							maxHeight="200px"
							borderColor={useColorModeValue("gray.300", "gray.600")}
							_focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px rgba(66, 153, 225, 0.6)" }}
						/>
						<Text fontSize="xs" fontWeight="bold" textAlign="right" mt={1} color="gray.800">
							{remainingChar}/{MAX_CHAR}
						</Text>

						<Input type="file" hidden ref={imageRef} onChange={handleImageChange} />
						<Flex alignItems="center" mt={2}>
							<BsFillImageFill
								style={{ marginLeft: "5px", cursor: "pointer" }}
								size={20}
								onClick={() => imageRef.current.click()}
								color={useColorModeValue("blue.500", "blue.300")}
							/>
						</Flex>
					</FormControl>

					{imgUrl && (
						<Flex mt={5} w="full" justifyContent="center" position="relative">
							<Image src={imgUrl} alt="Selected img" borderRadius="md" maxH="200px" />
							<CloseButton
								onClick={() => {
									setImgUrl("");
								}}
								bg="gray.800"
								color="white"
								position="absolute"
								top={2}
								right={2}
							/>
						</Flex>
					)}
				</ModalBody>
				<ModalFooter justifyContent="center">
					<Button colorScheme="blue" mr={3} onClick={handleCreatePost} isLoading={loading}>
						Post
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
};

export default CreatePost;
