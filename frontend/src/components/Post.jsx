import { Avatar } from "@chakra-ui/avatar";
import { Image } from "@chakra-ui/image";
import { Box, Flex, Text, useBreakpointValue, keyframes } from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";
import Actions from "./Actions";
import { useEffect, useState } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import postsAtom from "../atoms/postsAtom";
import { formatDistanceToNow } from "date-fns";
import useShowToast from "../hooks/useShowToast";
import { DeleteIcon } from "@chakra-ui/icons";

const slideUp = keyframes`
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const Post = ({ post, postedBy }) => {
  const [user, setUser] = useState(null); // ensure this is called always
  const [posts, setPosts] = useRecoilState(postsAtom);
  const currentUser = useRecoilValue(userAtom);
  const navigate = useNavigate();
  const showToast = useShowToast();


  // UseEffect will only fetch user once per `postedBy` change
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/users/profile/${postedBy._id || postedBy}`);
        const data = await res.json();
        if (!data.error) setUser(data); // update user state with the fetched data
      } catch (error) {
        console.error(error);
      }
    };

    fetchUser();
  }, [postedBy]); // only refetch if `postedBy` changes

  const handleDeletePost = async (e) => {
  };

  // Always call hooks consistently
  const postWidth = useBreakpointValue({
    base: "100%", // Full width on mobile
    lg: "70%", // 50% width on large screens (desktop)
  });

  if (!user) return null; // Return null if user is not yet fetched, to prevent inconsistent renders

  return (
    <Link to={`/${user.username}/post/${post._id}`}>
      <Box
        borderRadius="lg"
        boxShadow="md"
        p={4}
        mb={5}
        transition="transform 0.3s ease, box-shadow 0.3s ease"
        _hover={{ transform: "translateY(-5px)", boxShadow: "lg" }}
        animation={`${slideUp} 0.5s ease-in-out`}
        width={postWidth} // Apply dynamic width
      >
        <Flex direction="column" gap={2} alignItems="flex-start">
          <Flex justify="flex-start" alignItems="center" gap={4}>
            <Avatar
              size="md"
              src={user.profilePic || "/default-avatar.png"}
              name={user.username}
              cursor="pointer"
              _hover={{ transform: "scale(1.1)" }}
              onClick={(e) => {
                e.preventDefault();
                navigate(`/${user.username}`);
              }}
            />
            <Box flex={1} mt={-5} ml={1}>
              <Flex justify="space-between" alignItems="center">
                <Text fontWeight="bold" fontSize="lg">
                  {user.username}
                </Text>
                <Text fontSize="sm" color="gray.500" mt={50} ml={-25}>
                  {formatDistanceToNow(new Date(post.createdAt))} ago
                </Text>
                {currentUser ?._id === post.postedBy._id && (
                <DeleteIcon size={20} ml={75} onClick={handleDeletePost} cursor="pointer" />
              )}
              </Flex>
             
            </Box>
          </Flex>

          <Box w="full">
            <Text mt={2}>{post.text}</Text>
            {post.img && (
              <Image
                src={post.img}
                alt="Post Image"
                borderRadius="md"
                mt={4}
                _hover={{ transform: "scale(1.02)" }}
                transition="transform 0.3s ease"
              />
            )}
            {post.video && (
              <video
                src={post.video}
                controls
                width="100%"
                style={{ borderRadius: "10px", marginTop: "10px" }}
              />
            )}
            <Actions post={post} />
          </Box>
        </Flex>
      </Box>
    </Link >
  );
};

export default Post;
