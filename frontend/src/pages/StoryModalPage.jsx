import React, { useState, useEffect } from 'react';
import {
    Box, Avatar, Text, IconButton, Flex, Spinner, Progress, Modal, ModalOverlay, ModalContent,
    ModalHeader, ModalCloseButton, ModalBody,
    useBreakpointValue,
    useColorMode
} from '@chakra-ui/react';
import { ChevronRightIcon, ChevronLeftIcon, ArrowBackIcon, DeleteIcon, ViewIcon } from '@chakra-ui/icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import userAtom from '../atoms/userAtom';

const StoryModalPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { userStories, initialStoryIndex } = location.state || {};
    const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex || 0);
    const [progress, setProgress] = useState(0);
    const [viewersModalOpen, setViewersModalOpen] = useState(false);
    const [viewers, setViewers] = useState([]);
    const [viewCount, setViewCount] = useState(0); // Define viewCount state
    const [deleting, setDeleting] = useState(false);
    const loggedInUser = useRecoilValue(userAtom); // Retrieve logged-in user info
    const { colorMode } = useColorMode();

    const modalBgColor = useBreakpointValue({
        base: "white", // Default background for mobile
        dark: "black", // Background color in dark mode
        light: "white" // Background color in light mode
    });

    useEffect(() => {
        if (userStories && userStories[currentStoryIndex]?.mediaType === 'image') {
            setProgress(0);
            const progressInterval = setInterval(() => {
                setProgress((prev) => (prev < 100 ? prev + 1 : 100));
            }, 50);

            // Trigger view on loading the story
            const triggerViewStory = async () => {
                const story = userStories[currentStoryIndex];
                await fetch(`/api/stories/${story._id}/view`, { method: 'POST' });
            };
            triggerViewStory();

            const timer = setTimeout(handleNextStory, 5000);

            return () => {
                clearTimeout(timer);
                clearInterval(progressInterval);
            };
        }
    }, [currentStoryIndex, userStories]);

    const handleNextStory = () => {
        if (userStories && currentStoryIndex < userStories.length - 1) {
            setCurrentStoryIndex(currentStoryIndex + 1);
        } else {
            navigate('/');
        }
    };

    const handlePrevStory = () => {
        if (currentStoryIndex > 0) {
            setCurrentStoryIndex(currentStoryIndex - 1);
        } else {
            navigate('/');
        }
    };

    const handleDeleteStory = async () => {
        setDeleting(true);
        try {
            const story = userStories[currentStoryIndex];
            await fetch(`/api/stories/${story._id}`, { method: 'DELETE' });
            navigate('/');
        } catch (error) {
            console.error('Error deleting story:', error);
        } finally {
            setDeleting(false);
        }
    };

    const handleViewersModal = async () => {
        setViewersModalOpen(true); // Open modal immediately
        try {
            const story = userStories[currentStoryIndex];

            // Trigger the view story API
            await fetch(`/api/stories/${story._id}/view`, { method: 'POST' }); // Use POST for a view action

            // Fetch viewers and view count after view is registered
            const response = await fetch(`/api/stories/${story._id}/getviews`);
            const data = await response.json();
            console.log('Viewers data:', data); // Log the response

            setViewers(data.viewers); // Set viewers after data is fetched
            setViewCount(data.viewCount); // Set the viewCount state after data is fetched
        } catch (error) {
            console.error('Error fetching viewers:', error);
        }
    };

    if (!userStories) {
        return <Spinner />;
    }

    const story = userStories[currentStoryIndex];
    const isOwnStory = loggedInUser?._id === story.user._id;
    const formattedDate = new Date(story.createdAt).toLocaleString();

    return (
        <Box position="relative" background="black" minHeight="100vh" color="white" display="flex" justifyContent="center">
            {userStories.length > 0 ? (
                <Flex direction="column" align="center" width="100%" maxWidth="600px" >
                    <Progress
                        value={story.mediaType === 'image' ? progress : 100}
                        size="xs"
                        colorScheme="blue"
                        width="100%"
                        position="absolute"
                        top={0}
                        zIndex={10}
                    />

                    <IconButton
                        icon={<ArrowBackIcon />}
                        aria-label="Back to Home"
                        onClick={() => navigate('/')}
                        position="absolute"
                        top={4}
                        left={2}
                        zIndex={10}
                        color="white"
                        background="transparent"
                        _hover={{ background: "transparent" }}
                    />

                    <Flex position="absolute" top={1} left={39} align="center" p={2} borderRadius="md" zIndex={10}>
                    <Link to={`/${story.user.username}`}>
                        <Avatar
                            src={story.user.profilePic}
                            size="md"
                            border="3px solid blue"
                        />
                    </Link>
                        <Box ml={2}>
                            <Text fontWeight="bold">{story.user.username}</Text>
                            <Text fontSize="sm" mt={1}>{formattedDate}</Text>
                        </Box>
                    </Flex>

                    <Box position="relative" 
                        width="100%"  
                        maxWidth="90%" 
                        height="auto"
                         mt={20}   
                         aspectRatio="9 / 16" 
                        justifyContent="center"
                         alignItems="center"
                    >
                        {story.mediaType === 'video' ? (
                            <video
                                src={story.mediaUrl}
                                autoPlay
                                onEnded={handleNextStory}
                                style={{ width: '100%', height: 'auto', borderRadius: '10px', controls: false }}
                            />
                        ) : (
                            <img
                                src={story.mediaUrl}
                                alt="Story"
                                style={{ width: '100%', height: 'auto', borderRadius: '10px' }}
                            />
                        )}

                        <IconButton
                            icon={<ChevronLeftIcon />}
                            aria-label="Previous Story"
                            onClick={handlePrevStory}
                            position="absolute"
                            left={0}
                            top="50%"
                            color="whiteAlpha.900"
                            background="transparent"
                            _hover={{ background: "transparent" }}
                            zIndex={5}
                        />
                        <IconButton
                            icon={<ChevronRightIcon />}
                            aria-label="Next Story"
                            onClick={handleNextStory}
                            position="absolute"
                            right={0}
                            top="50%"
                            color="whiteAlpha.900"
                            background="transparent"
                            _hover={{ background: "transparent" }}
                            zIndex={5}
                        />
                    </Box>

                    {isOwnStory && (
                        <>
                            <IconButton
                                icon={<DeleteIcon />}
                                aria-label="Delete Story"
                                onClick={handleDeleteStory}
                                position="absolute"
                                top={4}
                                right={2}
                                color="red.500"
                                background="transparent"
                                _hover={{ background: "transparent" }}
                                zIndex={10}
                                isLoading={deleting}
                            />
                            <IconButton
                                icon={<ViewIcon />}
                                aria-label="View Story Viewers"
                                onClick={handleViewersModal}
                                position="absolute"
                                top={4}
                                right={14}
                                color="white"
                                background="transparent"
                                _hover={{ background: "transparent" }}
                                zIndex={10}
                            />
                        </>
                    )}
                </Flex>
            ) : (
                <Spinner />
            )}

            {/* Modal to show story viewers */}
            <Modal isOpen={viewersModalOpen} onClose={() => setViewersModalOpen(false)} >
                <ModalOverlay />
                <ModalContent
                    background={colorMode === "dark" ? "black" : "white"}
                    p={4}
                    borderRadius="md"
                    shadow="lg"
                >
                    <ModalHeader color={colorMode === "dark" ? "white" : "black"}>Story Viewers ({viewers.length})</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {viewers.length > 0 ? (
                            viewers.map((viewer) => (
                                <Flex
                                    key={viewer._id}
                                    align="center"
                                    mb={4}
                                    p={3}
                                    borderRadius="md"
                                    borderWidth="1px"
                                    boxShadow="md"
                                    _hover={{ bg: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)" }}
                                >
                                    <Avatar src={viewer.profilePic} size="md" />
                                    <Text ml={3} fontWeight="bold">{viewer.username}</Text>
                                </Flex>
                            ))
                        ) : (
                            <Text>No viewers yet!</Text>
                        )}
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default StoryModalPage;
