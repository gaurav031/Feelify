import React, { useEffect, useState } from "react";
import { Box, Flex, Spinner, Heading, useColorModeValue, keyframes } from "@chakra-ui/react";
import useShowToast from "../hooks/useShowToast";
import Post from "../components/Post";
import { useRecoilState } from "recoil";
import postsAtom from "../atoms/postsAtom";
import SuggestedUsers from "../components/SuggestedUsers";
import StoryPage from "./StoryPage";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const HomePage = () => {
  const [posts, setPosts] = useRecoilState(postsAtom);
  const [loading, setLoading] = useState(true);
  const showToast = useShowToast();
  const textColor = useColorModeValue("gray.900", "whiteAlpha.900");

  useEffect(() => {
    const getFeedPosts = async () => {
      setLoading(true);
      setPosts([]);
      try {
        const res = await fetch("/api/posts/feed");
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        if (data.error) {
          showToast("Error", data.error, "error");
          return;
        }
        setPosts(Array.isArray(data) ? data : []);
      } catch (error) {
        showToast("Error", error.message || "An error occurred", "error");
      } finally {
        setLoading(false);
      }
    };
    getFeedPosts();
  }, [showToast, setPosts]);

  return (
    <Box  color={textColor} minHeight="100vh" p={5} animation={`${fadeIn} 0.5s ease-in-out`}>
      <Box >
        <StoryPage />
      </Box>
      <Flex
        gap={5}
       
        alignItems="flex-start"
        direction={{ base: "column", md: "row" }}
        animation={`${fadeIn} 1s ease-in-out`}
      >
        <Box flex={70}>
          {loading ? (
            <Flex justify="center">
              <Spinner size="xl" />
            </Flex>
          ) : posts.length === 0 ? (
            <Box textAlign="center" mt={6}>
              <Heading as="h2" size="lg" mb={4} fontFamily="Poppins, sans-serif">
                Follow some users to see the feed
              </Heading>
              <Box display={{ base: "block", md: "none" }}>
                <SuggestedUsers />
              </Box>
            </Box>
          ) : (
            posts.map((post, index) => (
              <React.Fragment key={post._id}>
                <Post post={post} postedBy={post.postedBy} />
                {index === 0 && (
                  <Box display={{ base: "block", md: "none" }} mt={4}>
                    <SuggestedUsers />
                  </Box>
                )}
                {index === posts.length - 1 && <Box mb="100px" />}
              </React.Fragment>
            ))
          )}
        </Box>
        <Box flex={30} display={{ base: "none", md: "block" }}>
          <SuggestedUsers />
        </Box>
      </Flex>
    </Box>
  );
};

export default HomePage;
