# SPDX-License-Identifier: AGPL-3.0-only
cmake_minimum_required(VERSION 3.22.1)
project(appmodules)
include(${REACT_ANDROID_DIR}/cmake-utils/ReactNative-application.cmake)
if(NOT AUREA_BUNDLED_MEDIA)
    add_subdirectory(../cpp airplay-media)
endif()
