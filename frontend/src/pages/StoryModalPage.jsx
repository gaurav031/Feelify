import React, { useState, useEffect } from 'react';
import {
    Box,
    Avatar,
    Text,
    IconButton,
    Flex,
    Spinner,
    Progress,
} from '@chakra-ui/react';
import { ChevronRightIcon, ChevronLeftIcon, ArrowBackIcon } from '@chakra-ui/icons';
import { useLocation, useNavigate } from 'react-router-dom';

const StoryModalPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { userStories, initialStoryIndex } = location.state || {};
    const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex || 0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Automatically advance to the next story or home if no next story
        if (userStories && userStories[currentStoryIndex]?.mediaType === 'image') {
            setProgress(0);
            const progressInterval = setInterval(() => {
                setProgress((prev) => (prev < 100 ? prev + 1 : 100));
            }, 50); // Increment progress every 50ms

            const timer = setTimeout(handleNextStory, 5000); // Show image for 5 seconds

            return () => {
                clearTimeout(timer); // Clear timer on component unmount or when story changes
                clearInterval(progressInterval); // Clear progress interval
            };
        }
    }, [currentStoryIndex, userStories]);

    const handleNextStory = () => {
        if (userStories && currentStoryIndex < userStories.length - 1) {
            setCurrentStoryIndex(currentStoryIndex + 1);
        } else {
            navigate('/'); // Navigate to home when no more stories
        }
    };

    const handlePrevStory = () => {
        if (currentStoryIndex > 0) {
            setCurrentStoryIndex(currentStoryIndex - 1);
        } else {
            navigate('/'); // Navigate to home if at the start
        }
    };

    if (!userStories) {
        return <Spinner />; // Show a spinner while waiting for userStories
    }

    const story = userStories[currentStoryIndex];
    const formattedDate = new Date(story.createdAt).toLocaleString(); // Format timestamp

    return (
        <Box position="relative" background="black" minHeight="100vh" color="white" display="flex" alignItems="center" justifyContent="center">
            {userStories.length > 0 ? (
                <Flex direction="column" align="center" width="100%" maxWidth="600px">
                    {/* Loading Progress Line */}
                    <Progress
                        value={story.mediaType === 'image' ? progress : 100}
                        size="xs"
                        colorScheme="blue"
                        width="100%"
                        position="absolute"
                        top={0}
                        zIndex={10}
                    />

                    {/* Back button to navigate to home */}
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
                        <Avatar
                            src={story.user.profilePic}
                            size="md"
                            border="3px solid blue"
                        />
                        <Box ml={2}>
                            <Text fontWeight="bold">{story.user.username}</Text>
                            <Text fontSize="sm" mt={1}>{formattedDate}</Text> {/* Display timestamp */}
                        </Box>
                    </Flex>
                    <Box position="relative" width="100%" height="auto">
                        {story.mediaType === 'video' ? (
                            <video
                                src={story.mediaUrl}
                                autoPlay
                                controls
                                onEnded={handleNextStory}
                                style={{ width: '100%', height: 'auto', borderRadius: '10px' }}
                            />
                        ) : (
                            <img
                                src={story.mediaUrl}
                                alt="Story"
                                style={{ width: '100%', height: 'auto', borderRadius: '10px' }}
                            />
                        )}

                        {/* Navigation buttons */}
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
                </Flex>
            ) : (
                <Spinner />
            )}
        </Box>
    );
};

export default StoryModalPage;
