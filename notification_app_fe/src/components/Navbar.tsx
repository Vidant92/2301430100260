import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { useNavigate, useLocation } from "react-router-dom";

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <AppBar position="static" elevation={1}>
      <Toolbar>
        <NotificationsIcon sx={{ mr: 1 }} />
        <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
          Notification Manager
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            color="inherit"
            onClick={() => navigate("/")}
            variant={location.pathname === "/" ? "outlined" : "text"}
          >
            List
          </Button>
          <Button
            color="inherit"
            onClick={() => navigate("/create")}
            variant={location.pathname === "/create" ? "outlined" : "text"}
          >
            Create
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
