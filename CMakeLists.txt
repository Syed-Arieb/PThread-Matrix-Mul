cmake_minimum_required(VERSION 3.16)

project(PThreadMatrixMul LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Include the pthreads-win32 directory from the local dependencies
include_directories("${CMAKE_SOURCE_DIR}/dependencies/include")

# Link the pthreads-win32 library from the local dependencies
link_directories("${CMAKE_SOURCE_DIR}/dependencies/lib")

add_executable(PThreadMatrixMul main.cpp)

include(GNUInstallDirs)
install(TARGETS PThreadMatrixMul
    LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
)

target_link_libraries(PThreadMatrixMul pthreadVC2)

# Custom command to copy pthreadVC2.dll to the executable directory
add_custom_command(
    TARGET PThreadMatrixMul POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy
        "${CMAKE_SOURCE_DIR}/dependencies/dll/pthreadVC2.dll"
        $<TARGET_FILE_DIR:PThreadMatrixMul>
)
