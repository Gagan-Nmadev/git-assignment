package NucleusTeq_Training_Assignments.GaganNamdev_java_training.Session_01.Basic_Java;

import java.util.Scanner;

/**
 * AreaCalculator class
 * This program calculates area of different shapes based on user choice
 * Demonstrates OOP, input validation, and clean structure
 */
public class AreaCalculator {

    // Constant values
    private static final double PI = 3.14159;

    public static void main(String[] args) {

        Scanner scanner = new Scanner(System.in);

        System.out.println("Choose shape to calculate area:");
        System.out.println("1. Circle");
        System.out.println("2. Rectangle");
        System.out.println("3. Triangle");

        int choice = scanner.nextInt();

        switch (choice) {
            case 1:
                calculateCircleArea(scanner);
                break;

            case 2:
                calculateRectangleArea(scanner);
                break;

            case 3:
                calculateTriangleArea(scanner);
                break;

            default:
                System.out.println("Invalid choice!");
        }

        scanner.close();
    }

