public class TemperatureConverter {

    //  Celsius to Fahrenheit conversion
    public void celsiusToFahrenheit(double celsius) {

        double fahrenheit = (celsius * 9 / 5) + 32;

        System.out.println("Celsius to Fahrenheit:");
        System.out.println(celsius + " °C = " + fahrenheit + " °F");
    }

    // Fahrenheit to Celsius conversion
    public void fahrenheitToCelsius(double fahrenheit) {

        double celsius = (fahrenheit - 32) * 5 / 9;

        System.out.println("\nFahrenheit to Celsius:");
        System.out.println(fahrenheit + " °F = " + celsius + " °C");
    }
}
