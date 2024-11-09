import React, { useState, useEffect, useRef } from "react";
import { Box, Flex, Text, Button, Spinner, Avatar } from "@chakra-ui/react";
import axios from "axios";
import VideoAction from "../components/VideoAction";
import { Link } from "react-router-dom";

const VideoFeedPage = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const containerRef = useRef(null);

    const videoRefs = useRef([]);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/posts/feed?page=${page}`);
            const data = response.data;

            if (data.length > 0) {
                setPosts((prevPosts) => [...prevPosts, ...data]);
                setPage(page + 1);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Error fetching posts", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleScroll = () => {
        const container = containerRef.current;
        if (
            container.scrollHeight - container.scrollTop <= container.clientHeight + 50 &&
            !loading &&
            hasMore
        ) {
            fetchPosts();
        }
    };

    useEffect(() => {
        const container = containerRef.current;
        if (container) {
            container.addEventListener("scroll", handleScroll);
            return () => {
                container.removeEventListener("scroll", handleScroll);
            };
        }
    }, [loading, hasMore]);

    const handleVideoClick = (index) => {
        const video = videoRefs.current[index];
        if (video) {
            video.paused ? video.play() : video.pause();
        }
    };

    // Swipe handling
    const [startTouch, setStartTouch] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);

    const handleTouchStart = (e, index) => {
        const touchStart = e.touches[0].clientY;
        setStartTouch(touchStart);
        setIsSwiping(true);
    };

    const handleTouchMove = (e, index) => {
        if (!isSwiping) return;

        const touchMove = e.touches[0].clientY;
        const video = videoRefs.current[index];

        if (video) {
            const moveDistance = touchMove - startTouch;
            video.style.transform = `translateY(${moveDistance}px)`; // Move the video based on swipe distance
        }
    };

    const handleTouchEnd = (e, index) => {
        if (!isSwiping) return;

        const video = videoRefs.current[index];
        if (video) {
            const moveDistance = e.changedTouches[0].clientY - startTouch;

            // Slide video off screen if swipe is significant
            if (Math.abs(moveDistance) > 100) {
                const direction = moveDistance > 0 ? 1 : -1; // Swipe up or down
                video.style.transition = "transform 0.5s ease-in-out";
                video.style.transform = `translateY(${direction * 100}vh)`; // Move video up or down

                // After the video has moved off-screen, update the feed
                setTimeout(() => {
                    setPosts((prevPosts) => prevPosts.slice(1)); // Remove the current video from the feed
                }, 500); // Allow animation to finish before removing
            } else {
                // Reset position if swipe is not significant
                video.style.transition = "transform 0.3s ease-in-out";
                video.style.transform = "translateY(0)";
            }
        }

        setIsSwiping(false);
    };

    return (
        <Box width="100%" height="100vh" overflow="hidden">
            <Flex direction="column" justify="flex-start" align="center" height="100%" overflow="auto" paddingTop="20px" position="relative">
                <Box ref={containerRef} display="flex" flexDirection="column" width="100%" overflowY="auto" justifyContent="flex-start" alignItems="center" padding="10px">
                    {posts.length > 0 ? (
                        posts.map((post, index) => (
                            post.video && (
                                <Box key={post._id} mt={2} mb={2} aspectRatio="9 / 16" position="relative" display="flex" justifyContent="center">
                                    <Box
                                        position="relative"
                                        width="100%"
                                        height="100%"
                                        background="black"
                                        display="flex"
                                        justifyContent="center"
                                        alignItems="center"
                                    >
                                        <video
                                            ref={(el) => (videoRefs.current[index] = el)}
                                            width="100%"
                                            controls={false}
                                            autoPlay={false}
                                            data-index={index}
                                            style={{
                                                objectFit: "cover",
                                                borderRadius: "8px",
                                                maxWidth: "100%",
                                                transition: "transform 0.3s ease-in-out", // Smooth transition
                                            }}
                                            onClick={() => handleVideoClick(index)}
                                            onTouchStart={(e) => handleTouchStart(e, index)}
                                            onTouchMove={(e) => handleTouchMove(e, index)}
                                            onTouchEnd={(e) => handleTouchEnd(e, index)}
                                        >
                                            <source src={post.video} type="video/mp4" />
                                            Your browser does not support the video tag.
                                        </video>

                                        <Box position="absolute" top="10px" left="10px" display="flex" alignItems="center" color="white" fontSize="lg" fontWeight="bold" padding="5px" borderRadius="5px" zIndex="1">
                                            {post.postedBy ? (
                                                <>
                                                    <Link to={`/${post.postedBy?.username}`}>
                                                        <Avatar
                                                            src={post.postedBy.profilePic || "/default-avatar.png"}
                                                            alt="User Profile"
                                                            boxSize={["40px", "40px", "60px"]}
                                                            borderRadius="full"
                                                            mr={2}
                                                            cursor="pointer"
                                                            _hover={{ transform: "scale(1.05)", transition: "0.2s" }}
                                                        />
                                                    </Link>
                                                    <Text mt={-2} fontWeight="thin">@{post.postedBy.username}</Text>
                                                </>
                                            ) : (
                                                <Text mt={-2} fontWeight="thin">@Anonymous</Text>
                                            )}
                                        </Box>

                                        <Box position="absolute" bottom="10px" left="10px" color="white" fontSize="lg" fontWeight="bold" padding="5px" borderRadius="5px" width="90%" zIndex="1">
                                            <Text fontSize="md" fontWeight="bold">Caption</Text>
                                            <Text fontSize="sm" fontWeight="normal" color="gray.200">
                                                {post.text || "No caption"}
                                            </Text>
                                        </Box>

                                        <Box position="absolute" top={[200, 400]} right={0} display="flex" flexDirection="column" alignItems="center" zIndex={5}>
                                            <VideoAction post={post} />
                                        </Box>
                                    </Box>
                                </Box>
                            )
                        ))
                    ) : (
                        <Spinner size="xl" />
                    )}
                </Box>
            </Flex>

            {loading && (
                <Box textAlign="center" mt={5}>
                    <Spinner size="xl" />
                    <Text>Loading more posts...</Text>
                </Box>
            )}

            {hasMore && !loading && (
                <Box textAlign="center" mt={5}>
                    <Button colorScheme="teal" onClick={fetchPosts}>
                        Load More
                    </Button>
                </Box>
            )}
        </Box>
    );
};

export default VideoFeedPage;
