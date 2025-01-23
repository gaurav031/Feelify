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

const StoryPage = ({ currentUserId, loggedInUser }) => {
    const navigate = useNavigate();
    const [groupedStories, setGroupedStories] = useState([]);  // Holds grouped stories
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

            // Convert object to array
            const storiesArray = Object.values(grouped);

            // Separate own story and other users' stories
            const ownStory = storiesArray.find((group) => group.user._id === loggedInUser?._id);
            const otherUsersStories = storiesArray.filter((group) => group.user._id !== loggedInUser?._id);

            // If there are other users' stories, place the own story at the start
            const orderedStories = ownStory ? [ownStory, ...otherUsersStories] : otherUsersStories;

            setGroupedStories(orderedStories); // Set ordered stories
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
                <Modal isOpen={isUploadOpen} onClose={onUploadClose} size="md" isCentered>
                    <ModalOverlay />
                    <ModalContent
                        background={colorMode === 'dark' ? 'gray.800' : 'white'}
                        boxShadow="2xl"
                        borderRadius="lg"
                        p={4}
                        transform="scale(1.05)"
                    >
                        <ModalCloseButton />
                        <ModalBody>
                            <Text
                                mb={4}
                                fontSize="xl"
                                fontWeight="bold"
                                textAlign="center"
                                color={colorMode === 'dark' ? 'teal.200' : 'teal.600'}
                            >
                                Upload a Feeling
                            </Text>

                            <Flex
                                direction="column"
                                alignItems="center"
                                border="2px dashed"
                                borderColor={colorMode === 'dark' ? 'teal.500' : 'teal.300'}
                                borderRadius="lg"
                                p={4}
                                bgGradient={
                                    colorMode === 'dark'
                                        ? 'linear(to-br, gray.900, teal.800)'
                                        : 'linear(to-br, teal.100, teal.300)'
                                }
                                _hover={{
                                    borderColor: colorMode === 'dark' ? 'teal.200' : 'teal.500',
                                }}
                            >
                                <Input
                                    type="file"
                                    onChange={handleFileChange}
                                    accept="image/*,video/*"
                                    mb={3}
                                    border="none"
                                    _focus={{ outline: 'none' }}
                                    cursor="pointer"
                                />
                                <Text fontSize="sm" color="gray.500">
                                    Drag & drop a file or click to select
                                </Text>
                            </Flex>

                            {/* File Preview */}
                            {filePreview && (
                                <Box mt={4} textAlign="center" borderRadius="lg" overflow="hidden">
                                    {mediaType === 'image' ? (
                                        <Image
                                            src={filePreview}
                                            alt="Preview"
                                            maxW="100%"
                                            borderRadius="lg"
                                            boxShadow="lg"
                                        />
                                    ) : (
                                        <video width="100%" controls style={{ borderRadius: '10px' }}>
                                            <source src={filePreview} type={file?.type} />
                                        </video>
                                    )}
                                </Box>
                            )}

                            {/* Media Type Selection */}
                            <Flex mt={6} justifyContent="center" gap={4}>
                                <Button
                                    onClick={() => setMediaType('image')}
                                    colorScheme={mediaType === 'image' ? 'teal' : 'gray'}
                                    variant={mediaType === 'image' ? 'solid' : 'outline'}
                                    _hover={{
                                        bg: mediaType === 'image' ? 'teal.400' : 'gray.100',
                                    }}
                                >
                                    Image
                                </Button>
                                <Button
                                    onClick={() => setMediaType('video')}
                                    colorScheme={mediaType === 'video' ? 'teal' : 'gray'}
                                    variant={mediaType === 'video' ? 'solid' : 'outline'}
                                    _hover={{
                                        bg: mediaType === 'video' ? 'teal.400' : 'gray.100',
                                    }}
                                >
                                    Video
                                </Button>
                            </Flex>
                        </ModalBody>

                        <ModalFooter>
                            <Button
                                colorScheme="teal"
                                onClick={handleUpload}
                                isLoading={uploading}
                                px={6}
                                _hover={{
                                    bg: 'teal.400',
                                    transform: 'scale(1.05)',
                                }}
                                _active={{
                                    transform: 'scale(0.95)',
                                }}
                                borderRadius="lg"
                            >
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