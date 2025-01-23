import { useEffect, useState } from "react";
import UserHeader from "../components/UserHeader";
import { useParams } from "react-router-dom";
import useShowToast from "../hooks/useShowToast";
import { Box, Flex, Spinner, Text, VStack } from "@chakra-ui/react";
import Post from "../components/Post";
import useGetUserProfile from "../hooks/useGetUserProfile";
import { useRecoilState } from "recoil";
import postsAtom from "../atoms/postsAtom";
import { motion } from "framer-motion";

const UserPage = () => {
  const { user, loading } = useGetUserProfile();
  const { username } = useParams();
  const showToast = useShowToast();
  const [posts, setPosts] = useRecoilState(postsAtom);
  const [fetchingPosts, setFetchingPosts] = useState(true);

  useEffect(() => {
    const getPosts = async () => {
      if (!user) return;
      setFetchingPosts(true);
      try {
        const res = await fetch(`/api/posts/user/${username}`);
        const data = await res.json();
        setPosts(data);
      } catch (error) {
        showToast("Error", error.message, "error");
        setPosts([]);
      } finally {
        setFetchingPosts(false);
      }
    };

    getPosts();
  }, [username, showToast, setPosts, user]);

  if (!user && loading) {
    return (
      <Flex justifyContent={"center"} h="100vh" alignItems="center">
        <Spinner size={"xl"} thickness="4px" speed="0.65s" color="teal.500" />
      </Flex>
    );
  }

  if (!user && !loading)
    return (
      <Flex justifyContent="center" h="100vh" alignItems="center">
        <Text fontSize="2xl" fontWeight="bold" color="red.500">
          Oops! User not found. 😞
        </Text>
      </Flex>
    );

  return (
    <VStack
      spacing={6}
      p={4}
      bgGradient={{
        base: "linear(to-b, #FFD194, #70E1F5)",
        dark: "linear(to-b, #0f2027, #203a43, #2c5364)",
      }}
      minH="100vh"
      justifyContent="flex-start"
    >
      {/* User Header with Animation */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{ width: "100%" }}
      >
        <UserHeader user={user} />
      </motion.div>

      {/* Posts Section */}
      <Box w="full">
        {!fetchingPosts && posts.length === 0 && (
          <Text
            fontSize="xl"
            fontWeight="bold"
            textAlign="center"
            color="gray.600"
            mt={10}
          >
            This user hasn’t posted anything yet. 😢
          </Text>
        )}
        {fetchingPosts && (
          <Flex justifyContent="center" my={12}>
            <Spinner
              size="xl"
              thickness="4px"
              speed="0.75s"
              color="pink.400"
            />
          </Flex>
        )}

        {posts.map((post, index) => (
          <motion.div
            key={post._id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
          >
            <Box
              mb={index === posts.length - 1 ? 20 : 4}
              borderRadius="lg"
              overflow="hidden"
              boxShadow="lg"
              _hover={{ transform: "scale(1.02)" }}
              transition="all 0.3s ease-in-out"
            >
              <Post post={post} postedBy={post.postedBy} />
            </Box>
          </motion.div>
        ))}
      </Box>
    </VStack>
  );
};

export default UserPage;
