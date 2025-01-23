import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Flex,
  Text,
  Spinner,
  Avatar,
  Skeleton,
  useColorMode,
} from "@chakra-ui/react";
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
  const { colorMode } = useColorMode();

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
      container.scrollHeight - container.scrollTop <=
        container.clientHeight + 50 &&
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

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const videoIndex = Number(entry.target.dataset.index);
          const video = videoRefs.current[videoIndex];
          if (entry.isIntersecting) {
            video.play();
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.8 }
    );

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
        overflow="hidden"
        paddingTop="20px"
        position="relative"
      >
        <Box
          ref={containerRef}
          display="flex"
          flexDirection="column"
          width="100%"
          height="100vh"
          overflowY="auto"
          justifyContent="flex-start"
          alignItems="center"
          padding="0"
          css={{
            scrollSnapType: "y mandatory",
          }}
        >
          {loading && posts.length === 0 ? (
            Array.from({ length: 5 }).map((_, index) => (
              <Skeleton
                key={index}
                height="100vh"
                width="100%"
                borderRadius="8px"
              />
            ))
          ) : (
            posts.map((post, index) => (
              post.video && (
                <Box
                  key={post._id}
                  height="90vh"
                  position="relative"
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  mt={20}
                  css={{
                    scrollSnapAlign: "start",
                  }}
                  background={
                    colorMode === "dark" ? "gray.800" : "gray.200"
                  }
                >
                  <Box
                    position="relative"
                    width="100%"
                    height="100%"
                   
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    border="8px solid transparent"
                    borderRadius="16px"
                    animation="borderMove 2s linear infinite"
                    css={{
                      "@keyframes borderMove": {
                        "0%": { borderColor: "transparent" },
                        "50%": {
                          borderColor:
                            colorMode === "dark" ? "teal.500" : "pink.500",
                        },
                        "100%": { borderColor: "transparent" },
                      },
                    }}
                  >
                    <video
                      ref={(el) => (videoRefs.current[index] = el)}
                      width="100%"
                      height="100%"
                      controls={false}
                      autoPlay={false}
                      data-index={index}
                      style={{
                        objectFit: "cover",
                        width: "100%",
                        height: "100%",
                        borderRadius: "8px",
                      }}
                      onClick={() => handleVideoClick(index)}
                    >
                      <source src={post.video} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>

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
                      zIndex="1"
                    >
                      {post.postedBy ? (
                        <>
                          <Link to={`/${post.postedBy?.username}`}>
                            <Avatar
                              src={
                                post.postedBy.profilePic ||
                                "/default-avatar.png"
                              }
                              alt="User Profile"
                              boxSize="60px"
                              borderRadius="full"
                              mr={2}
                              cursor="pointer"
                              _hover={{
                                transform: "scale(1.05)",
                                transition: "0.2s",
                              }}
                            />
                          </Link>
                          <Text
                            mt={-2}
                            fontWeight="bold"
                            color={
                              colorMode === "dark" ? "white" : "black"
                            }
                          >
                            @{post.postedBy.username}
                          </Text>
                        </>
                      ) : (
                        <Text mt={-2} fontWeight="bold">
                          @Anonymous
                        </Text>
                      )}
                    </Box>

                    <Box
                      position="absolute"
                      bottom="10px"
                      left="10px"
                      color={
                        colorMode === "dark" ? "gray.100" : "gray.800"
                      }
                      fontSize="lg"
                      fontWeight="bold"
                      padding="5px"
                      borderRadius="5px"
                      width="90%"
                      zIndex="1"
                    >
                      <Text fontSize="lg" fontWeight="bold">
                        Caption
                      </Text>
                      <Text
                        fontSize="sm"
                        fontWeight="normal"
                        color={
                          colorMode === "dark" ? "gray.300" : "gray.600"
                        }
                      >
                        {post.text || "No caption"}
                      </Text>
                    </Box>

                    <Box
                      position="absolute"
                      top="50%"
                      right="10px"
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
          )}
        </Box>
      </Flex>

      {loading && posts.length > 0 && (
        <Box textAlign="center" mt={5}>
          <Spinner size="xl" />
          <Text>Loading more posts...</Text>
        </Box>
      )}
    </Box>
  );
};

export default VideoFeedPage;
