import React, { useEffect } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  Badge,
  Divider,
  Avatar,
  Heading,
  Skeleton,
  SkeletonCircle,
  useToast,
  keyframes,
  useColorModeValue,
} from '@chakra-ui/react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { formatRelative, isToday, isYesterday } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { setNotifications, markNotificationAsRead } from '../redux/notificationsSlice.js';

const bounceAnimation = keyframes`
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
`;

const shimmerAnimation = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

const Notifications = () => {
  const { notifications } = useSelector((state) => state.notifications);
  const dispatch = useDispatch();
  const [loading, setLoading] = React.useState(true);
  const toast = useToast();
  const navigate = useNavigate();

  const boxBg = useColorModeValue('gray.100', 'gray.700');
  const hoverBg = useColorModeValue('yellow.100', 'purple.800');
  const borderColor = useColorModeValue('yellow.300', 'purple.500');
  const textColor = useColorModeValue('gray.800', 'white');

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await axios.get('/api/notifications');
        dispatch(setNotifications(response.data));
      } catch (error) {
        toast({
          title: 'Oops!',
          description: 'Looks like the internet gremlins ate your notifications!',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [dispatch, toast]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await axios.put(`/api/notifications/${notificationId}`);
      dispatch(markNotificationAsRead(notificationId));
    } catch (error) {
      toast({
        title: 'Error!',
        description: 'The notification goblins are at it again!',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const groupNotificationsByDate = (notifications) => {
    const grouped = { today: [], yesterday: [], older: [] };
    notifications.forEach((notification) => {
      const createdAt = new Date(notification.createdAt);
      if (isToday(createdAt)) {
        grouped.today.push(notification);
      } else if (isYesterday(createdAt)) {
        grouped.yesterday.push(notification);
      } else {
        grouped.older.push(notification);
      }
    });
    return grouped;
  };

  const groupedNotifications = groupNotificationsByDate(notifications);

  return (
    <Box
      p={6}
      mt={5}
      maxW="lg"
      mx="auto"
      bgGradient={useColorModeValue('linear(to-r, teal.300, blue.500)', 'linear(to-r, purple.600, blue.800)')}
      borderRadius="lg"
      boxShadow="lg"
      animation={`${bounceAnimation} 2s infinite`}
    >
      <Text
        fontSize="3xl"
        mb={4}
        textAlign="center"
        color={useColorModeValue('white', 'yellow.300')}
        fontWeight="bold"
        textShadow="2px 2px black"
      >
         Notifications 🛎️
      </Text>
      {loading ? (
        <VStack spacing={4}>
          <SkeletonCircle size="12" />
          <Skeleton height="20px" width="80%" />
          <Skeleton height="20px" width="70%" />
          <Skeleton height="20px" width="60%" />
        </VStack>
      ) : (
        <VStack spacing={6} align="stretch">
          {Object.entries(groupedNotifications).map(([label, items]) => (
            <Box key={label}>
              {items.length > 0 && (
                <>
                  <Heading
                    fontSize="lg"
                    color={useColorModeValue('yellow.300', 'yellow.400')}
                    textShadow="1px 1px black"
                    mb={2}
                  >
                    {label === 'today'
                      ? '✨ Happening Now!'
                      : label === 'yesterday'
                      ? '👀 Just Yesterday'
                      : '📜 Blast from the Past'}
                  </Heading>
                  {items.map((notification) => (
                    <Box
                      key={notification._id}
                      p={4}
                      borderWidth="2px"
                      borderRadius="lg"
                      bg={notification.isRead ? boxBg : hoverBg}
                      borderColor={borderColor}
                      boxShadow="xl"
                      _hover={{
                        transform: 'scale(1.03)',
                        bg: hoverBg,
                        boxShadow: '2xl',
                      }}
                      animation={`${shimmerAnimation} 1.5s infinite linear`}
                    >
                      <HStack spacing={4} align="center">
                        <Avatar
                          src={notification.senderId?.profilePic || ''}
                          size="sm"
                          onClick={() =>
                            notification.senderId?.username &&
                            navigate(`/${notification.senderId.username}`)
                          }
                          border="2px solid teal"
                          _hover={{
                            borderColor: 'orange.400',
                          }}
                        />
                        <VStack align="start" spacing={0} width="full">
                          <HStack justify="space-between" width="100%">
                            <Text
                              fontWeight="bold"
                              color={textColor}
                              fontFamily="'Comic Sans MS', cursive"
                            >
                              {notification.message || 'No message available'}
                            </Text>
                            <Badge
                              colorScheme={notification.isRead ? 'green' : 'red'}
                              fontSize="0.8em"
                              animation={`${bounceAnimation} 1s infinite`}
                            >
                              {notification.isRead ? '✅ Read' : '🔥 New'}
                            </Badge>
                          </HStack>
                          <Text fontSize="sm" color="gray.500">
                            {formatRelative(new Date(notification.createdAt), new Date())}
                          </Text>
                        </VStack>
                      </HStack>

                      <Button
                        mt={2}
                        onClick={() => handleMarkAsRead(notification._id)}
                        colorScheme="yellow"
                        variant="solid"
                        size="sm"
                      >
                        Mark as Read
                      </Button>
                      <Divider my={2} />
                    </Box>
                  ))}
                </>
              )}
            </Box>
          ))}
          {notifications.length === 0 && (
            <Text textAlign="center" color="white" fontSize="lg">
              🎉 You’re all caught up! No more notifications to bug you.
            </Text>
          )}
        </VStack>
      )}
    </Box>
  );
};

export default Notifications;
