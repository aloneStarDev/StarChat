import React from "react";
import {
  View,
  Text,
  Button,
  TextInput,
  StyleSheet,
  ImageBackground,
} from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";

var image = require("../assets/bg.jpg");

export default function (params) {
  var username = "";
  var password = "";
  return (
    <ImageBackground source={image} style={styles.image}>
      <View style={styles.container}>
        <View style={styles.loginbox}>
          <Text style={styles.logo}>Star Chat</Text>
          <TextInput
            style={styles.inputs}
            placeholder="username"
            placeholderTextColor="#fff"
            onChangeText={(text) => {
              username = text;
            }}
          />
          <TextInput
            style={styles.inputs}
            placeholder="password"
            placeholderTextColor="#fff"
            onChangeText={(text) => {
              password = text;
            }}
            secureTextEntry={true}
          />
          <TouchableOpacity
            style={styles.btn}
            onPress={() => {
              console.log(username + "\t" + password);
            }}
          >
            <Text style={{ textAlign: "center" }}> Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => {
              params.navigation.navigate("Signup");
            }}
          >
            <Text style={{ textAlign: "center" }}> haven't account?</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignContent: "center",
    alignItems: "center",
  },
  loginbox: {
    borderWidth: 2,
    borderColor: "#29848c",
    padding: 10,
    backgroundColor: "#000000a2", //4f7e82aa
    borderRadius: 20,
    justifyContent: "center",
    alignContent: "center",
  },
  inputs: {
    paddingVertical: 10,
    marginVertical: 10,
    textAlign: "center",
    borderBottomColor: "#ff0000",
    borderBottomWidth: 2,
    fontSize: 20,
    // color: "#0a0a0a",
    color: "white",
    // backgroundColor: "#c44536",
  },
  btn: {
    color: "white",
    backgroundColor: "#843b62",
    textTransform: "uppercase",
    padding: 10,
    marginVertical: 5,
    borderRadius: 20,
  },
  logo: {
    textAlign: "center",
    fontSize: 40,
    textTransform: "uppercase",
    fontWeight: "bold",
    color: "white",
  },
  image: {
    height: "100%",
  },
});
