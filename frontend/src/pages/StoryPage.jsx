import React, { useState, useEffect } from 'react';
import {
    Box,
    Avatar,
    Text,
    IconButton,
    useDisclosure,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalCloseButton,
    ModalBody,
    ModalFooter,
    Button,
    Input,
    Flex,
    Spinner,
    useToast,
    Image,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useColorMode } from '@chakra-ui/react';

const StoryPage = ({ currentUserId }) => {
    const navigate = useNavigate();
    const [groupedStories, setGroupedStories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState(null);
    const [mediaType, setMediaType] = useState('image'); // Default to image
    const [filePreview, setFilePreview] = useState(null); // Preview URL for the selected file
    const { isOpen: isUploadOpen, onOpen: onUploadOpen, onClose: onUploadClose } = useDisclosure();
    const toast = useToast();
    const { colorMode } = useColorMode();

    useEffect(() => {
        fetchStories();
    }, []);

    // Fetch stories from the server
    const fetchStories = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/stories/getall');
            const storiesData = response.data;

            // Group stories by user
            const grouped = storiesData.reduce((acc, story) => {
                const userId = story.user._id;
                if (!acc[userId]) {
                    acc[userId] = {
                        user: story.user,
                        stories: [],
                    };
                }
                acc[userId].stories.push(story);
                return acc;
            }, {});

            // Convert object to array and move the current user's story to the beginning
            const storiesArray = Object.values(grouped);
            const currentUserStoryIndex = storiesArray.findIndex(group => group.user._id === currentUserId);

            if (currentUserStoryIndex > -1) {
                const [currentUserStory] = storiesArray.splice(currentUserStoryIndex, 1);
                storiesArray.unshift(currentUserStory); // Add current user's story at the beginning
            }

            setGroupedStories(storiesArray);
        } catch (error) {
            console.error("Error fetching stories:", error);
        } finally {
            setLoading(false);
        }
    };

    // Handle story card click to navigate to the story viewer
    const handleStoryClick = (userStories) => {
        navigate('/story-viewer', {
            state: {
                userStories: userStories.stories,
                initialStoryIndex: 0,
            },
        });
    };

    // Handle file change for upload
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);

        // Generate file preview
        const filePreviewUrl = URL.createObjectURL(selectedFile);
        setFilePreview(filePreviewUrl);

        // Set media type based on file type (image or video)
        if (selectedFile.type.startsWith('image/')) {
            setMediaType('image');
        } else if (selectedFile.type.startsWith('video/')) {
            setMediaType('video');
        }
    };

    // Handle the upload of the selected file
    const handleUpload = async () => {
        if (!file) {
            toast({
                title: "No file selected",
                description: "Please select a file to upload",
                status: "warning",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        const formData = new FormData();
        formData.append('media', file);
        formData.append('mediaType', mediaType);
        setUploading(true);

        try {
            await axios.post('/api/stories/create', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            toast({
                title: 'Story uploaded successfully!',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            onUploadClose();
            fetchStories();
        } catch (error) {
            console.error('Error creating story:', error);
            toast({
                title: 'Failed to upload story',
                description: 'Please try again later.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setUploading(false);
            setFile(null);
            setFilePreview(null); // Clear the preview after upload
        }
    };

    return (
        <Box overflowX="auto" whiteSpace="nowrap" p={2}>
            <Flex display="inline-flex" ml={-3}>
                {/* Create Story Card */}
                <Box display="flex" flexDirection="column" alignItems="center">
                    <IconButton
                        icon={<AddIcon />}
                        onClick={onUploadOpen}
                        aria-label="Add Story"
                        color={colorMode === 'dark' ? 'white' : 'black'}
                        border="3px solid red"
                        borderRadius="full"
                        size="lg"
                        position="relative"
                        top="14%"  // Adjust position as needed
                    />
                    <Text fontSize="sm" textAlign="center" fontWeight="bold" mt={5} ml={5}>
                        Share Feeling 
                    </Text>
                </Box>

                {/* User Story Cards */}
                {loading ? (
                    <Spinner />
                ) : (
                    groupedStories.map((userStories, index) => (
                        <Flex
                            direction="column"
                            justify="center"
                            align="center"
                            h="100px"
                            w="100px"
                            borderRadius="full"
                            key={index}
                            p={2}
                            onClick={() => handleStoryClick(userStories)}
                        >
                            <Avatar
                                src={userStories.user.profilePic}
                                border="3px solid blue"
                                size="md"
                                mb={2}
                            />
                            <Text fontSize="sm" textAlign="center" fontWeight="bold">
                                {userStories.user.username}
                            </Text>
                        </Flex>
                    ))
                )}

                {/* Upload Story Modal */}
                <Modal isOpen={isUploadOpen} onClose={onUploadClose} size="md" isCentered >
                    <ModalOverlay />
                    <ModalContent  background={colorMode === 'dark' ? "blackAlpha.900" : 'white'}> 
                        <ModalCloseButton />
                        <ModalBody>
                            <Text mb={4}>Upload a Story</Text>
                            <Input
                                type="file"
                                onChange={handleFileChange}
                                accept="image/*,video/*"
                                mb={3}
                            />
                            {/* Show Preview of the Selected File */}
                            {filePreview && (
                                <Box mt={3} textAlign="center">
                                    {mediaType === 'image' ? (
                                        <Image src={filePreview} alt="Preview" maxW="100%" />
                                    ) : mediaType === 'video' ? (
                                        <video width="100%" controls>
                                            <source src={filePreview} type={file.type} />
                                        </video>
                                    ) : null}
                                </Box>
                            )}
                            {/* Select Media Type (Image or Video) */}
                            <Flex mt={3}>
                                <Button
                                    onClick={() => setMediaType('image')}
                                    colorScheme={mediaType === 'image' ? 'blue' : 'gray'}
                                >
                                    Image
                                </Button>
                                <Button
                                    onClick={() => setMediaType('video')}
                                    colorScheme={mediaType === 'video' ? 'blue' : 'gray'}
                                    ml={2}
                                >
                                    Video
                                </Button>
                            </Flex>
                        </ModalBody>
                        <ModalFooter>
                            <Button colorScheme="blue" onClick={handleUpload} isLoading={uploading}>
                                Upload
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </Flex>
        </Box>
    );
};

export default StoryPage;
