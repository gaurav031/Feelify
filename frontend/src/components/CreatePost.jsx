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
import { FaLaughSquint } from "react-icons/fa";
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
            <ModalContent mx={4} my={6} maxW="lg" borderRadius="xl" boxShadow="2xl" background={colorMode === 'dark' ? "blackAlpha.900" : 'green.200'} style={{ backgroundImage: colorMode === 'dark' ? "url('/images/dark-funky-bg.jpg')" : "url('/images/light-funky-bg.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
                <ModalHeader textAlign="center" fontWeight="extrabold" fontSize="2xl" fontStyle="italic" color={colorMode === 'dark' ? 'yellow.400' : 'purple.800'}>
                    Let's Create Some Magic! 🌟
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6} display="flex" flexDirection="column" alignItems="center">
                    <FormControl w="100%" borderColor={colorMode === 'dark' ? 'yellow.500' : 'purple.400'} borderWidth="2px" borderRadius="md" p={4} boxShadow="lg">
                        <Textarea
                            placeholder="Share your thoughts, jokes, or secret recipes! 🥳"
                            onChange={handleTextChange}
                            value={postText}
                            resize="none"
                            minHeight="120px"
                            maxHeight="200px"
                            borderColor={colorMode === 'dark' ? "yellow.300" : "purple.300"}
                            fontFamily="Comic Sans MS, cursive"
                            _focus={{ borderColor: "teal.400", boxShadow: "0 0 0 1px teal" }}
                        />
                        <Text fontSize="xs" fontWeight="extrabold" textAlign="right" mt={1} color={colorMode === 'dark' ? 'yellow.200' : 'purple.700'}>
                            {remainingChar}/{MAX_CHAR} characters remaining. Go wild! 🎉
                        </Text>

                        <Flex alignItems="center" mt={4} gap={4}>
                            <Input type="file" hidden ref={imageRef} onChange={handleImageChange} />
                            <BsFillImageFill
                                style={{ cursor: "pointer" }}
                                size={28}
                                onClick={() => imageRef.current.click()}
                                color={colorMode === 'dark' ? "orange.300" : "blue.500"}
                                title="Upload Image"
                                onMouseEnter={(e) => e.target.style.transform = "scale(1.2)"}
                                onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
                            />
                            <Input type="file" hidden ref={videoRef} onChange={handleVideoChange} />
                            <IoMdVideocam
                                style={{ cursor: "pointer" }}
                                size={28}
                                onClick={() => videoRef.current.click()}
                                color={colorMode === 'dark' ? "pink.400" : "green.400"}
                                title="Upload Video"
                                onMouseEnter={(e) => e.target.style.transform = "scale(1.2)"}
                                onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
                            />
                            <FaLaughSquint
                                size={28}
                                color={colorMode === 'dark' ? "cyan.400" : "orange.400"}
                                style={{ cursor: "pointer" }}
                                title="Make me laugh!"
                                onMouseEnter={(e) => e.target.style.transform = "scale(1.2)"}
                                onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
                            />
                        </Flex>

                        {imgUrl && (
                            <Flex mt={5} w="full" justifyContent="center" position="relative">
                                <Image src={imgUrl} alt="Selected" borderRadius="lg" maxH="200px" boxShadow="xl" />
                                <CloseButton
                                    onClick={() => {
                                        setImgUrl("");
                                    }}
                                    bg="red.500"
                                    color="white"
                                    position="absolute"
                                    top={2}
                                    right={2}
                                    boxShadow="lg"
                                />
                            </Flex>
                        )}

                        {videoUrl && (
                            <Flex mt={5} w="full" justifyContent="center" position="relative">
                                <video src={videoUrl} alt="Selected" borderRadius="lg" maxH="200px" controls style={{ border: `3px dashed ${colorMode === 'dark' ? 'yellow.400' : 'purple.400'}` }} />
                                <CloseButton
                                    onClick={() => {
                                        setVideoUrl("");
                                    }}
                                    bg="red.500"
                                    color="white"
                                    position="absolute"
                                    top={2}
                                    right={2}
                                    boxShadow="lg"
                                />
                            </Flex>
                        )}

                        {loading ? (
                            <Flex justifyContent="center" mt={5}>
                                <Spinner size="lg" color={colorMode === 'dark' ? 'yellow.300' : 'purple.500'} />
                                <Text ml={2} fontStyle="italic" color={colorMode === 'dark' ? 'yellow.200' : 'purple.600'}>Uploading... Hold tight! 🚀</Text>
                            </Flex>
                        ) : success ? (
                            <Text fontSize="lg" fontWeight="extrabold" color={colorMode === 'dark' ? "green.400" : "pink.500"} textAlign="center" mt={5}>
                                🎉 Post created successfully! You're awesome! 🎉
                            </Text>
                        ) : (
                            <Button colorScheme={colorMode === 'dark' ? "yellow" : "pink"} mr={3} mt={10} onClick={handleCreatePost} isFullWidth>
                                🚀 Let's Go!
                            </Button>
                        )}
                    </FormControl>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default CreatePost;
