import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import TopNewsScreen from "./TopNewsScreen";
import LatestNewsScreen from "./LatestNewsScreen";
import MyTeamsNewsScreen from "./MyTeamsNewsScreen";

const Tab = createMaterialTopTabNavigator();

export default function HomeScreen() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Top" component={TopNewsScreen} />
      <Tab.Screen name="Latest" component={LatestNewsScreen} />
      <Tab.Screen name="My Teams" component={MyTeamsNewsScreen} />
    </Tab.Navigator>
  );
}
