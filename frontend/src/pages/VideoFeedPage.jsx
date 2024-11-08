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

    // Define videoRefs to store references to each video element
    const videoRefs = useRef([]);

    // Fetch posts
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

    // Handle scroll event to trigger fetching more posts when user reaches the bottom
    const handleScroll = () => {
        const container = containerRef.current;
        if (
            container.scrollHeight - container.scrollTop <= container.clientHeight + 50 && // Added a threshold of 50px
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

    // Pause the video when clicked
    const handleVideoClick = (index) => {
        const video = videoRefs.current[index];
        if (video) {
            video.paused ? video.play() : video.pause();
        }
    };

    // Intersection observer to detect when a video is in view
    const videoInView = (index) => {
        const video = videoRefs.current[index];
        const rect = video.getBoundingClientRect();
        return rect.top >= 0 && rect.bottom <= window.innerHeight;
    };

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const videoIndex = Number(entry.target.dataset.index);
                const video = videoRefs.current[videoIndex];
                if (entry.isIntersecting) {
                    // Play video when it comes into view
                    video.play();
                } else {
                    // Pause video when it goes out of view
                    video.pause();
                }
            });
        }, { threshold: 0.5 }); // Trigger when at least 50% of the video is in view

        posts.forEach((_, index) => {
            const video = videoRefs.current[index];
            if (video) observer.observe(video);
        });

        return () => {
            posts.forEach((_, index) => {
                const video = videoRefs.current[index];
                if (video) observer.unobserve(video);
            });
        };
    }, [posts]);

    return (
        <Box width="100%" height="100vh" overflow="hidden">
            <Flex
                direction="column"
                justify="flex-start"
                align="center"
                height="100%"
                overflow="auto"
                paddingTop="20px"
                position="relative"
            >
                {/* Infinite scroll container */}
                <Box
                    ref={containerRef}
                    display="flex"
                    flexDirection="column"
                    width="100%"
                    overflowY="auto"
                    justifyContent="flex-start"
                    alignItems="center"
                    padding="10px"
                >
                    {posts.length > 0 ? (
                        posts.map((post, index) => (
                            post.video && (
                                <Box
                                    key={post._id}
                                    width="100%"
                                    p={2}
                                    borderRadius="md"
                                    boxShadow="md"
                                    mb={4} // Space between posts
                                    position="relative"
                                    display="flex"
                                    justifyContent="center"
                                >
                                    <Box
                                        position="relative"
                                        width="100%"
                                        height="auto"
                                        maxWidth="100%"
                                        aspectRatio="9 / 16"
                                        background="black"
                                        display="flex"
                                        justifyContent="center"
                                        alignItems="center"
                                    >
                                        <video
                                            ref={(el) => (videoRefs.current[index] = el)} // Store video references
                                            width="100%"
                                            controls={false} // Disable default controls
                                            autoPlay={false}
                                            data-index={index} // Store index in data attribute for reference
                                            style={{
                                                objectFit: "cover",
                                                borderRadius: "8px",
                                                maxWidth: "100%",
                                            }}
                                            onClick={() => handleVideoClick(index)} // Pause on click
                                        >
                                            <source src={post.video} type="video/mp4" />
                                            Your browser does not support the video tag.
                                        </video>

                                        {/* Overlay with user profile and username */}
                                        {/* Container for Profile and Username */}
                                        <Box
                                            position="absolute"
                                            top="10px"
                                            left="10px"
                                            display="flex"
                                            alignItems="center"
                                            color="white"
                                            fontSize="lg"
                                            fontWeight="bold"
                                            padding="5px"
                                            borderRadius="5px"
                                            zIndex="1" // Ensure the profile section appears above the image
                                        >
                                          
                                                <Avatar
                                                    src={post.postedBy.profilePic}
                                                    alt="User Profile"
                                                    boxSize={["40px", "40px", "60px"]}
                                                    borderRadius="full"
                                                    mr={2}
                                                />
                                         
                                            <Text mt={-2} fontWeight="thin">@{post.postedBy.username}</Text>
                                        </Box>

                                        {/* Caption */}
                                        <Box
                                            position="absolute"
                                            bottom="10px"
                                            left="10px"
                                            color="white"
                                            fontSize="lg"
                                            fontWeight="bold"
                                            padding="5px"
                                            borderRadius="5px"
                                            width="90%" // Ensure the caption doesn't stretch out too wide
                                            zIndex="1" // Ensure the caption section appears above the image
                                        >
                                            <Text fontSize="md" fontWeight="bold">
                                                Caption
                                            </Text>
                                            <Text fontSize="sm" fontWeight="normal" color="gray.200">
                                                {post.text || "No caption"}
                                            </Text>
                                        </Box>



                                        {/* Video Action on the right side, centered vertically */}
                                        <Box
                                            position="absolute"
                                            top={[200, 400]}
                                            right={0}

                                            display="flex"
                                            flexDirection="column"
                                            alignItems="center"
                                            zIndex={5}

                                        >
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

            {/* Loading Spinner or Message */}
            {loading && (
                <Box textAlign="center" mt={5}>
                    <Spinner size="xl" />
                    <Text>Loading more posts...</Text>
                </Box>
            )}

            {/* Load More Button */}
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
