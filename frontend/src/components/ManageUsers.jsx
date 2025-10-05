import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
  Box, Heading, Table, Thead, Tbody, Tr, Th, Td, Button, Input, useToast 
} from "@chakra-ui/react";

const ManageUsers = () => {
  const [users, setUsers] = useState([]); // Ensure initial state is an array
  const [passwords, setPasswords] = useState({});
  const toast = useToast();

  useEffect(() => {
    axios
      .get("/api/admin/users", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
      .then(res => {
        if (Array.isArray(res.data)) {
          setUsers(res.data);
        } else {
          console.error("Unexpected response format:", res.data);
          setUsers([]); // Fallback to empty array
        }
      })
      .catch(err => {
        console.error("Error fetching users:", err);
        setUsers([]); // Fallback in case of error
      });
  }, []);

  const deleteUser = async (id) => {
    try {
      await axios.delete(`/api/admin/user/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      setUsers(users.filter(user => user._id !== id));
      toast({ title: "User Deleted", status: "success", duration: 2000 });
    } catch (err) {
      console.error("Error deleting user:", err);
      toast({ title: "Error deleting user", status: "error", duration: 2000 });
    }
  };

  const updatePassword = async (id) => {
    if (!passwords[id]) return;
    try {
      await axios.put(`/api/admin/user/password/${id}`, { newPassword: passwords[id] }, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      toast({ title: "Password Updated", status: "success", duration: 2000 });
    } catch (err) {
      console.error("Error updating password:", err);
      toast({ title: "Error updating password", status: "error", duration: 2000 });
    }
  };

  return (
    <Box>
      <Heading size="lg" mb={4}>Manage Users</Heading>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Username</Th>
            <Th>Email</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {users.length > 0 ? (
            users.map(user => (
              <Tr key={user._id}>
                <Td>{user.username}</Td>
                <Td>{user.email}</Td>
                <Td>
                  <Input
                    placeholder="New Password"
                    size="sm"
                    onChange={(e) => setPasswords({ ...passwords, [user._id]: e.target.value })}
                  />
                  <Button size="sm" colorScheme="yellow" ml={2} onClick={() => updatePassword(user._id)}>Update</Button>
                  <Button size="sm" colorScheme="red" ml={2} onClick={() => deleteUser(user._id)}>Delete</Button>
                </Td>
              </Tr>
            ))
          ) : (
            <Tr>
              <Td colSpan="3" textAlign="center">No users found</Td>
            </Tr>
          )}
        </Tbody>
      </Table>
    </Box>
  );
};

export default ManageUsers;
