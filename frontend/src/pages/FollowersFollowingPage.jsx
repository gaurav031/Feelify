import React, { useEffect, useState } from 'react';
import { Box, Heading, Spinner, Text, Avatar, Flex, Tabs, TabList, TabPanels, Tab, TabPanel,useColorMode  } from '@chakra-ui/react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';

const FollowersFollowingPage = () => {
    const { username } = useParams(); // Get username from URL
    const [userId, setUserId] = useState(null);
    const [followers, setFollowers] = useState([]);
    const [following, setFollowing] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
	const { colorMode } = useColorMode();
    useEffect(() => {
        const fetchUserId = async () => {
            try {
                const userResponse = await axios.get(`/api/users/profile/${username}`);
                setUserId(userResponse.data._id);
            } catch (error) {
                console.error('Error fetching user ID:', error);
                setError('Could not retrieve user information.');
                setLoading(false); // Ensure loading is set to false on error
            }
        };

        fetchUserId();
    }, [username]);

    useEffect(() => {
        const fetchData = async () => {
            if (!userId) return; // Ensure userId is set before fetching data

            try {
                const [followersResponse, followingResponse] = await Promise.all([
                    axios.get(`/api/users/${userId}/followers`),
                    axios.get(`/api/users/${userId}/following`),
                ]);

               
                
                setFollowers(followersResponse.data);
                setFollowing(followingResponse.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching followers/following data:', error);
                setError('Could not fetch followers and following data.');
                setLoading(false);
            }
        };

        fetchData();
    }, [userId]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
                <Spinner size="xl" />
            </Box>
        );
    }

    if (error) {
        return <Text color="red.500" textAlign="center" mt={4}>{error}</Text>;
    }

    return (
        <Box p={8}>
            <Tabs variant="soft-rounded" colorScheme="blue">
            <TabList gap={20}>
			<Tab
				// When active, apply red background and white text
				bg="transparent"
				_selected={{
					bg: "red.500", // Red when selected
					color:  colorMode === "dark" ? "white" : "black", // White text color when selected
				}}
				color={colorMode === "dark" ? "white.900" : "black"} 
			>
				Followers
			</Tab>
			<Tab
				// When active, apply red background and white text
				bg="transparent"
				_selected={{
					bg: "red.500", // Red when selected
					color:  colorMode === "dark" ? "white" : "black", 
				}}
				color={colorMode === "dark" ? "white.900" : "black"} 
			>
				Following
			</Tab>
		</TabList>

                <TabPanels>
                    {/* Followers Tab Panel */}
                    <TabPanel>
                        {followers.length === 0 ? (
                            <Text>No followers found.</Text>
                        ) : (
                            followers.map((follower) => (
                                <Flex key={follower._id} align="center" mb={4} p={4} borderRadius="md" boxShadow="sm" borderWidth="1px">
                                    <Link to={`/${follower.username}`}>
                                        <Avatar name={follower.username} src={follower.profilePic} mr={4} />
                                    </Link>
                                    <Box>
                                        <Text fontWeight="bold">{follower.name}</Text>
                                        <Text fontSize="sm" color="gray.500">
                                            @{follower.username}
                                        </Text>
                                    </Box>
                                </Flex>
                            ))
                        )}
                    </TabPanel>

                    {/* Following Tab Panel */}
                    <TabPanel>
                        {following.length === 0 ? (
                            <Text>No following people found.</Text>
                        ) : (
                            following.map((followedUser) => (
                                <Flex key={followedUser._id} align="center" mb={4} p={4} borderRadius="md" boxShadow="sm" borderWidth="1px">
                                  <Link to={`/${followedUser.username}`}>

                                        <Avatar name={followedUser.name} src={followedUser.profilePic} mr={4} />
                                    </Link>
                                    <Box>
                                        <Text fontWeight="bold">{followedUser.name}</Text>
                                        <Text fontSize="sm" color="gray.500">
                                            @{followedUser.username}
                                        </Text>
                                    </Box>
                                </Flex>
                            ))
                        )}
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </Box>
    );
};

export default FollowersFollowingPage;
