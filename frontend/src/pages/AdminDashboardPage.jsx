import React from "react";
import { Box, Flex, Heading, Spacer, Button } from "@chakra-ui/react";
import { Link, Outlet } from "react-router-dom";

const AdminDashboard = () => {
  return (
    <Box>
      <Flex bg="gray.800" color="white" p={4} align="center">
        <Heading size="md">Admin Dashboard</Heading>
        <Spacer />
        <Button colorScheme="red" onClick={() => localStorage.removeItem("token")}>
          Logout
        </Button>
      </Flex>

      <Flex>
        {/* Sidebar */}
        <Box w="250px" bg="gray.700" p={4} color="white" h="100vh">
          <Button as={Link} to="/admin/users" w="full" mb={2} colorScheme="blue">
            Manage Users
          </Button>
          <Button as={Link} to="/admin/posts" w="full" colorScheme="green">
            Manage Posts
          </Button>
        </Box>

        {/* Main Content */}
        <Box p={6} flex="1">
          <Outlet />
        </Box>
      </Flex>
    </Box>
  );
};

export default AdminDashboard;
