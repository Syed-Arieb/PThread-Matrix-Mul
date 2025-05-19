# Matrix Multiplication with Pthreads
This project demonstrates matrix multiplication using the POSIX threads (pthreads) library. The implementation is designed to be easily understandable and includes detailed comments for better comprehension. The project is configured to work on Windows using the pthreads-win32 compatibility layer.

# Features
- Matrix Multiplication: Efficiently multiplies two matrices using pthreads.
- Portable: Uses local dependencies for easier management and portability.
- CMake Integration: Automates the build process and handles the copying of necessary DLL files.

# Getting Started
## Prerequisites
- CMake (version 3.16 or higher)
- A C++ compiler that supports C++17
- pthreads-win32 library (included in the dependencies directory)

## Building the Project
1. Clone the repository:

```
git clone https://github.com/Syed-Arieb/PThread-Matrix-Multiplication-Assignment.git

cd PThread-Matrix-Multiplication-Assignment
```

2. Create a build directory and navigate into it:

```
mkdir build
cd build
```

3. Run CMake to configure the project:

```
cmake -G "Visual Studio 16 2019" ..
```

4. Build the project using CMake:

```
cmake --build . --config Release
```

## Running the Executable
After building the project, you can run the executable:

```
Release\PThreadMatrixMul.exe
```

## Project Structure

```
project_dir/
├── dependencies/
│   ├── include/
│   ├── lib/
│   └── dll/
├── main.cpp
├── CMakeLists.txt
└── build/
```

# Acknowledgments
Thanks to the pthreads-win32 project for providing the compatibility layer for POSIX threads on Windows.
