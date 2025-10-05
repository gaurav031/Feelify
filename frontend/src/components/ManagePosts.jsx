import React, { useEffect, useState } from "react";
import axios from "axios";
import { Box, Heading, Table, Thead, Tbody, Tr, Th, Td, Button, Image, useToast } from "@chakra-ui/react";

const ManagePosts = () => {
  const [posts, setPosts] = useState([]);
  const toast = useToast();

  useEffect(() => {
    axios.get("/api/admin/posts", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
      .then(res => setPosts(res.data))
      .catch(err => console.error(err));
  }, []);

  const deletePost = async (id) => {
    await axios.delete(`/api/admin/post/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
    setPosts(posts.filter(post => post._id !== id));
    toast({ title: "Post Deleted", status: "success", duration: 2000 });
  };

  return (
    <Box>
      <Heading size="lg" mb={4}>Manage Posts</Heading>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Post</Th>
            <Th>Username</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {posts.map(post => (
            <Tr key={post._id}>
              <Td>
                {post.image && <Image src={post.image} boxSize="50px" objectFit="cover" />}
                {post.content}
              </Td>
              <Td>{post.postedBy?.username}</Td>
              <Td>
                <Button size="sm" colorScheme="red" onClick={() => deletePost(post._id)}>Delete</Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default ManagePosts;
