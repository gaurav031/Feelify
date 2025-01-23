import { Avatar, Divider, Flex, Text, useColorModeValue, Box } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Comment = ({ reply, lastReply }) => {
	const bgColor = useColorModeValue("yellow.200", "#2C2C54");
	const textColor = useColorModeValue("black", "white");
	const dividerColor = useColorModeValue("#E2E8F0", "#4A5568");

	return (
		<>
			<Flex
				as={motion.div}
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4 }}
				gap={4}
				py={2}
				my={2}
				w={"full"}
				bg={bgColor}
				borderRadius="md"
				boxShadow="lg"
				p={4}
				_hover={{
					transform: "scale(1.03)",
					boxShadow: "xl",
					transition: "transform 0.3s ease, box-shadow 0.3s ease",
				}}
			>
				<Link to={`/${reply.username}`}> {/* Ensure this path is correct */}
					<Box
						as={motion.div}
						whileHover={{ scale: 1.2 }}
						whileTap={{ scale: 0.95 }}
						borderRadius="full"
					>
						<Avatar
							src={reply.userProfilePic}
							size={"sm"}
							border="2px solid"
							borderColor={textColor}
							boxShadow="sm"
						/>
					</Box>
				</Link>
				<Flex gap={1} w={"full"} flexDirection={"column"}>
					<Flex
						w={"full"}
						justifyContent={"space-between"}
						alignItems={"center"}
					>
						<Text
							fontSize="sm"
							fontWeight="bold"
							color={textColor}
							_hover={{
								textDecoration: "underline",
								cursor: "pointer",
							}}
						>
							{reply.username}
						</Text>
					</Flex>
					<Text color="black.900" fontStyle="italic" fontSize="sm">
						{reply.text}
					</Text>
				</Flex>
			</Flex>
			<Divider
				borderColor={dividerColor}
				my={2}
				style={!lastReply ? {} : { marginBottom: "50px" }}
			/>
		</>
	);
};

export default Comment;
