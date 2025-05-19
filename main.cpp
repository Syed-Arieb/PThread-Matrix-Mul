#define _TIMESPEC_DEFINED
#include <pthread.h>
#include <stdio.h>
#include <stdlib.h>

#define MATRIX_SIZE 2  // Size of the matrix

// Hardcoded matrices
int matrixA[MATRIX_SIZE][MATRIX_SIZE] = {
    {1, 2},
    {3, 4}
};

int matrixB[MATRIX_SIZE][MATRIX_SIZE] = {
    {5, 6},
    {7, 8}
};

int resultMatrix[MATRIX_SIZE][MATRIX_SIZE];  // Result matrix

// Structure to pass data to threads
typedef struct {
    int row;  // Row index to be processed
} ThreadData;

// Function to multiply a single row of matrixA with matrixB
void* multiplyRow(void* arg) {
    ThreadData* data = (ThreadData*)arg;
    int currentRow = data->row;  // Current row to process

    for (int col = 0; col < MATRIX_SIZE; col++) {
        resultMatrix[currentRow][col] = 0;  // Initialize the result cell
        for (int k = 0; k < MATRIX_SIZE; k++) {
            resultMatrix[currentRow][col] += matrixA[currentRow][k] * matrixB[k][col];  // Multiply and accumulate
        }
    }

    pthread_exit(NULL);  // Exit the thread
    return NULL;
}

int main() {
    pthread_t threads[MATRIX_SIZE];  // Array to hold thread IDs
    ThreadData threadData[MATRIX_SIZE];  // Array to hold data for each thread

    // Create threads to multiply each row
    for (int i = 0; i < MATRIX_SIZE; i++) {
        threadData[i].row = i;  // Assign row index
        pthread_create(&threads[i], NULL, multiplyRow, &threadData[i]);  // Create thread
    }

    // Wait for all threads to complete
    for (int i = 0; i < MATRIX_SIZE; i++) {
        pthread_join(threads[i], NULL);  // Join thread
    }

    // Print the result matrix
    printf("Result matrix C = A x B:\n");
    for (int i = 0; i < MATRIX_SIZE; i++) {
        for (int j = 0; j < MATRIX_SIZE; j++) {
            printf("%d ", resultMatrix[i][j]);  // Print each element
        }
        printf("\n");  // New line after each row
    }

    return 0;  // Exit the program
}
