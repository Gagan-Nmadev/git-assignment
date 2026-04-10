import java.util.Scanner;

public class FibonacciSeries {

    public static void main(String[] args) {

        Scanner sc = new Scanner(System.in);

        System.out.print("Enter limit: ");
        int limit = sc.nextInt();

        if (limit <= 0) {
            System.out.println("Please enter a positive number");
            return;
        }

        int firstNumber = 0;
        int secondNumber = 1;

        System.out.println("Fibonacci Series:");

        for (int i = 1; i <= limit; i++) {

            System.out.print(firstNumber + " ");

            int nextNumber = firstNumber + secondNumber;

            firstNumber = secondNumber;
            secondNumber = nextNumber;
        }

        sc.close();
    }
}
