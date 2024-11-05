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
    useColorMode,
} from '@chakra-ui/react';
import { AddIcon, ChevronRightIcon, ChevronLeftIcon } from '@chakra-ui/icons';
import axios from 'axios';

const StoryPage = () => {
    const [stories, setStories] = useState([]);
    const [groupedStories, setGroupedStories] = useState([]);
    const [currentUserStories, setCurrentUserStories] = useState([]);
    const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
    const [currentUserIndex, setCurrentUserIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState(null);
    const [mediaType, setMediaType] = useState('image');
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { isOpen: isUploadOpen, onOpen: onUploadOpen, onClose: onUploadClose } = useDisclosure();
    const toast = useToast();
    const [comment, setComment] = useState('');
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    useEffect(() => {
        fetchStories();
    }, []);

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
            setGroupedStories(Object.values(grouped));
        } catch (error) {
            console.error("Error fetching stories:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStoryClick = (userStories, userIndex) => {
        setCurrentUserStories(userStories.stories);
        setCurrentStoryIndex(0);
        setCurrentUserIndex(userIndex);
        onOpen();
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) {
            alert("Please select a file to upload");
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
                title: 'Failed to upload story.',
                description: 'Please try again later.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setUploading(false);
            setFile(null);
        }
    };

    const handleNextStory = () => {
        if (currentStoryIndex < currentUserStories.length - 1) {
            setCurrentStoryIndex(currentStoryIndex + 1);
        } else if (currentUserIndex < groupedStories.length - 1) {
            const nextUserIndex = currentUserIndex + 1;
            setCurrentUserStories(groupedStories[nextUserIndex].stories);
            setCurrentUserIndex(nextUserIndex);
            setCurrentStoryIndex(0);
        }
    };

    const handlePrevStory = () => {
        if (currentStoryIndex > 0) {
            setCurrentStoryIndex(currentStoryIndex - 1);
        } else if (currentUserIndex > 0) {
            const prevUserIndex = currentUserIndex - 1;
            setCurrentUserStories(groupedStories[prevUserIndex].stories);
            setCurrentUserIndex(prevUserIndex);
            setCurrentStoryIndex(groupedStories[prevUserIndex].stories.length - 1);
        }
    };

    return (
        <Box overflowX="auto" whiteSpace="nowrap" p={2} >
            <Flex display="inline-flex" gap={3} >
                {/* Create Story Card */}
                <Box
                    border={`${isDark ? 'white' : 'black'} solid 1px`} // Border color based on theme
                    borderRadius="full"
                    position="relative"
                    w="100px"
                    h="100px"
                    bg={'linear-gradient(to right, rgba(255, 0, 0, 0.5), rgba(0, 0, 255, 0.5))' } // Background color based on theme
                    boxShadow="md"
                    cursor="pointer"
                    onClick={onUploadOpen}
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                >
                    {/* Icon centered */}
                    <IconButton
                        icon={<AddIcon />}
                        aria-label="Add Story"
                        bg="blue.500"
                        color="white"
                        borderRadius="full"
                        size="lg" // Adjust size as needed
                        position="absolute"
                        top="50%"
                        left="50%"
                        transform="translate(-50%, -50%)"
                        zIndex={1} // Ensure icon is above the background
                    />
                    {/* Text below icon */}

                </Box>

                {/* User Story Cards */}
                {loading ? (
                    <Spinner />
                ) : (
                    groupedStories.map((userStories, index) => (
                        <Box
                            key={userStories.user._id} // Ensure unique key
                            borderRadius="full"
                            position="relative"
                            w="100px"
                            h="100px"
                            boxShadow="md"
                            cursor="pointer"
                            alignItems="center"
                            justifyContent="center"
                            backgroundImage={
                                userStories.stories[0]?.mediaType === 'video' 
                                    ? 'linear-gradient(to right, rgba(255, 0, 0, 0.5), rgba(0, 0, 255, 0.5))'  // Gradient for video
                                    : `url(${userStories.stories[0]?.mediaUrl})` // Image for photo
                            }                            backgroundSize="cover"
                            
                            backgroundPosition="center"
                            onClick={() => handleStoryClick(userStories, index)}
                        >
                            <Flex direction="column" justify="flex-end" align="center" h="100%" p={2}  borderRadius="full">
                                <Avatar src={userStories.user.profilePic} border="3px solid blue" size="md" mb={2} />
                                <Text  fontSize="sm" textAlign="center" color={isDark ? 'white' : 'black'} fontWeight="bold">
                                    {userStories.user.username}
                                </Text>
                            </Flex>
                        </Box>
                    ))
                )}

                {/* Upload Story Modal */}
                <Modal isOpen={isUploadOpen} onClose={onUploadClose} size="md" isCentered>
                    <ModalOverlay />
                    <ModalContent>
                        <ModalCloseButton />
                        <ModalBody>
                            <Text mb={4}>Upload a Story</Text>
                            <Input
                                type="file"
                                onChange={handleFileChange}
                                accept="image/*,video/*"
                                mb={3}
                            />
                            <Flex>
                                <Button onClick={() => setMediaType('image')} colorScheme={mediaType === 'image' ? 'blue' : 'gray'}>
                                    Image
                                </Button>
                                <Button onClick={() => setMediaType('video')} colorScheme={mediaType === 'video' ? 'blue' : 'gray'} ml={2}>
                                    Video
                                </Button>
                            </Flex>
                        </ModalBody>
                        <ModalFooter>
                            <Button colorScheme="blue" onClick={handleUpload} isLoading={uploading}>Upload</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>

                {/* Story Modal */}
                <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered >
                    <ModalOverlay />
                    <ModalContent background="transparent" boxShadow="none">
                        <ModalCloseButton />
                        <ModalBody position="relative" padding={0}>
                            {currentUserStories.length > 0 ? (
                                <Flex direction="column" align="center">
                                    <Box position="relative" width="auto" height="auto">
                                        {currentUserStories[currentStoryIndex].mediaType === 'video' ? (
                                            <video src={currentUserStories[currentStoryIndex].mediaUrl} controls style={{ width: '100%', height: 'auto' }} />
                                        ) : (
                                            <img src={currentUserStories[currentStoryIndex].mediaUrl} alt="Story" style={{ width: '100%', height: 'auto' }} />
                                        )}
                                        <Flex position="absolute" top={2} left={2} align="center" background="transparent">
                                            <Avatar src={currentUserStories[currentStoryIndex].user.profilePic} size="md" />
                                            <Text color="white" fontWeight="bold" ml={2}>
                                                {currentUserStories[currentStoryIndex].user.username}
                                            </Text>
                                        </Flex>
                                        <IconButton
                                            icon={<ChevronLeftIcon />}
                                            aria-label="Previous Story"
                                            onClick={handlePrevStory}
                                            position="absolute"
                                            left={0}
                                            top="50%"
                                            background="red"
                                            transform="translateY(-50%)"
                                            colorScheme="blackAlpha"
                                        />
                                        <IconButton
                                            icon={<ChevronRightIcon />}
                                            aria-label="Next Story"
                                            onClick={handleNextStory}
                                            position="absolute"
                                            right={0}
                                            top="50%"
                                            background="red"
                                            transform="translateY(-50%)"
                                            colorScheme="blackAlpha"
                                        />
                                    </Box>
                                </Flex>
                            ) : (
                                <Spinner />
                            )}
                        </ModalBody>
                    </ModalContent>
                </Modal>
            </Flex>
        </Box>
    );
};

export default StoryPage;
