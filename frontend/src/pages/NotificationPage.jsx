import React, { useEffect } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  Spinner,
  Badge,
  Divider,
  Avatar,
  Heading,
  useToast
} from '@chakra-ui/react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { formatRelative, isToday, isYesterday } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { setNotifications, markNotificationAsRead } from '../redux/notificationsSlice.js';

const Notifications = () => {
  const { notifications, unreadCount } = useSelector((state) => state.notifications);
  const dispatch = useDispatch();
  const [loading, setLoading] = React.useState(true);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await axios.get('/api/notifications');
        dispatch(setNotifications(response.data));
        console.log(data)
      } catch (error) {
         console.log(err)
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
        title: 'Error marking notification as read.',
        description: 'There was an error updating the notification.',
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
    <Box p={5} maxW="lg" mx="auto" bg="gray.50" borderRadius="lg" boxShadow="lg">
      <Text fontSize="2xl" mb={4} textAlign="center" color="teal.600">
        Notifications
      </Text>
      {loading ? (
        <Spinner size="lg" color="teal.500" />
      ) : (
        <VStack spacing={4} align="stretch">
          {Object.entries(groupedNotifications).map(([label, items]) => (
            <Box key={label}>
              {items.length > 0 && (
                <>
                  <Heading fontSize="lg" color="teal.700" mb={2}>
                    {label === 'today'
                      ? 'Today'
                      : label === 'yesterday'
                      ? 'Yesterday'
                      : 'Older'}
                  </Heading>
                  {items.map((notification) => (
                    <Box
                      key={notification._id}
                      p={4}
                      borderWidth="1px"
                      borderRadius="md"
                      bg={notification.isRead ? 'white' : 'teal.50'}
                      boxShadow="md"
                      transition="0.2s ease"
                      _hover={{
                        boxShadow: 'xl',
                        bg: notification.isRead ? 'white' : 'teal.100',
                      }}
                    >
                      <HStack spacing={4} align="center">
                        <Avatar
                          src={notification.senderId?.profilePic || ''}
                          size="sm"
                          onClick={() =>
                            notification.senderId?.username &&
                            navigate(`/${notification.senderId.username}`)
                          }
                        />
                        <VStack align="start" spacing={0} width="full">
                          <HStack justify="space-between" width="100%">
                            <Text fontWeight="bold" color="gray.800">
                              {notification.message || 'No message available'}
                            </Text>
                            <Badge colorScheme={notification.isRead ? 'green' : 'red'}>
                              {notification.isRead ? 'Read' : 'New'}
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
                        colorScheme="teal"
                        variant="outline"
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
            <Text textAlign="center" color="gray.600">
              No notifications available
            </Text>
          )}
        </VStack>
      )}
    </Box>
  );
};

export default Notifications;
