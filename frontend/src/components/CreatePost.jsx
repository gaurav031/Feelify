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
    Spinner,
} from "@chakra-ui/react";
import { useRef, useState, useEffect } from "react";
import usePreviewImg from "../hooks/usePreviewImg";
import { BsFillImageFill } from "react-icons/bs";
import { IoMdVideocam } from "react-icons/io";
import { useRecoilState, useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import useShowToast from "../hooks/useShowToast";
import postsAtom from "../atoms/postsAtom";
import { useParams } from "react-router-dom";
import { useColorMode } from '@chakra-ui/react';

const MAX_CHAR = 500;

const CreatePost = ({ isOpen, onClose }) => {
    const [postText, setPostText] = useState("");
    const { handleImageChange, imgUrl, setImgUrl } = usePreviewImg();
    const imageRef = useRef(null);
    const videoRef = useRef(null);
    const [videoUrl, setVideoUrl] = useState("");
    const [selectedVideoFile, setSelectedVideoFile] = useState(null);
    const [remainingChar, setRemainingChar] = useState(MAX_CHAR);
    const user = useRecoilValue(userAtom);
    const showToast = useShowToast();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);  // New success state
    const [posts, setPosts] = useRecoilState(postsAtom);
    const { username } = useParams();
    const { colorMode } = useColorMode();

    // Reset state when modal is closed
    const resetState = () => {
        setPostText("");
        setImgUrl("");
        setVideoUrl("");
        setSelectedVideoFile(null);
        setRemainingChar(MAX_CHAR);
        setLoading(false);  // Ensure loading is reset
        setSuccess(false);  // Reset success message
    };

    useEffect(() => {
        if (!isOpen) {
            resetState(); // Clear previous data when modal is closed
        }
    }, [isOpen]);

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

    const handleVideoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setVideoUrl(URL.createObjectURL(file));
            setSelectedVideoFile(file);
        }
    };

    const handleCreatePost = async () => {
        setLoading(true);
        setSuccess(false);  // Reset success message before uploading
        const formData = new FormData();
        formData.append('postedBy', user._id);
        formData.append('text', postText);
        
        // Append the actual file instead of imgUrl
        if (imageRef.current.files[0]) {
            formData.append('img', imageRef.current.files[0]);
        }
        if (selectedVideoFile) {
            formData.append('video', selectedVideoFile);
        }
    
        try {
            const response = await fetch('/api/posts/create', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            if (data.error) {
                showToast("Error", data.error, "error");
                return;
            }
            showToast("Success", "Post created successfully", "success");
            setPosts((prevPosts) => [data, ...prevPosts]);
            setSuccess(true);  // Set success to true after posting
            resetState();
            onClose();
        } catch (error) {
            showToast("Error", error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent mx={4} my={6} maxW="lg" borderRadius="md" boxShadow="lg"  background={colorMode === 'dark' ? "blackAlpha.900" : 'white'}>
                <ModalHeader textAlign="center" fontWeight="bold" fontSize="lg">Create Post</ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6} display="flex" flexDirection="column" alignItems="center">
                    <FormControl w="100%">
                        <Textarea
                            placeholder="What's on your mind?"
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

                        <Flex alignItems="center" mt={2}>
                            <Input type="file" hidden ref={imageRef} onChange={handleImageChange} />
                            <BsFillImageFill
                                style={{ marginRight: "10px", cursor: "pointer" }}
                                size={24}
                                onClick={() => imageRef.current.click()}
                                color={useColorModeValue("blue.500", "blue.300")}
                                title="Upload Image"
                            />
                            <Input type="file" hidden ref={videoRef} onChange={handleVideoChange} />
                            <IoMdVideocam
                                style={{ cursor: "pointer" }}
                                size={24}
                                onClick={() => videoRef.current.click()}
                                color={useColorModeValue("blue.500", "blue.300")}
                                title="Upload Video"
                            />
                        </Flex>

                        {imgUrl && (
                            <Flex mt={5} w="full" justifyContent="center" position="relative">
                                <Image src={imgUrl} alt="Selected" borderRadius="md" maxH="200px" boxShadow="md" />
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

                        {videoUrl && (
                            <Flex mt={5} w="full" justifyContent="center" position="relative">
                                <video src={videoUrl} alt="Selected" borderRadius="md" maxH="200px" controls />
                                <CloseButton
                                    onClick={() => {
                                        setVideoUrl("");
                                    }}
                                    bg="gray.800"
                                    color="white"
                                    position="absolute"
                                    top={2}
                                    right={2}
                                />
                            </Flex>
                        )}

                        {loading ? (
                            <Flex justifyContent="center" mt={5}>
                                <Spinner size="lg" />
                                <Text ml={2}>Uploading...</Text>
                            </Flex>
                        ) : success ? (
                            <Text fontSize="lg" fontWeight="bold" color="green.500" textAlign="center" mt={5}>
                                Post created successfully!
                            </Text>
                        ) : (
                            <Button colorScheme="blue" mr={3} mt={10} onClick={handleCreatePost} isFullWidth>
                                Post
                            </Button>
                        )}
                    </FormControl>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default CreatePost;
